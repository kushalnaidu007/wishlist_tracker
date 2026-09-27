"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { currentMonthStart, isCurrentMonth } from "@/lib/format";
import { isSupportedCurrency } from "@/lib/currency";
import type { Database } from "@/lib/supabase/database.types";

export async function requireUser() {
  const supabase = await createClient();
  if (!supabase) throw new Error("Supabase is not configured.");
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in.");
  return { supabase, user };
}

/**
 * Applies a delta to the current month's balance — used to keep the
 * balance a true running total as items are bought/unbought/corrected,
 * rather than a static ceiling that ignores what's already been spent.
 * No-ops if the month's balance hasn't been set yet (nothing to adjust).
 * Allowed to go negative: overspending should show up, not be hidden.
 */
async function adjustCurrentMonthBalance(
  supabase: SupabaseClient<Database>,
  userId: string,
  delta: number
) {
  if (delta === 0) return { error: null };

  const month = currentMonthStart();
  const { data, error: fetchError } = await supabase
    .from("balance_entries")
    .select("amount")
    .eq("user_id", userId)
    .eq("month", month)
    .maybeSingle();

  if (fetchError) return { error: fetchError.message };
  if (!data) return { error: null };

  const { error } = await supabase
    .from("balance_entries")
    .update({ amount: Number(data.amount) + delta })
    .eq("user_id", userId)
    .eq("month", month);

  return { error: error?.message ?? null };
}

/**
 * Same idea as adjustCurrentMonthBalance, but for a group item — the
 * two balances are now fully separate, so a group purchase must adjust
 * the purchaser's GROUP entry, not their personal one.
 */
async function adjustGroupBalance(
  supabase: SupabaseClient<Database>,
  groupId: string,
  userId: string,
  delta: number
) {
  if (delta === 0) return { error: null };

  const month = currentMonthStart();
  const { data, error: fetchError } = await supabase
    .from("group_balance_entries")
    .select("amount")
    .eq("group_id", groupId)
    .eq("user_id", userId)
    .eq("month", month)
    .maybeSingle();

  if (fetchError) return { error: fetchError.message };
  if (!data) return { error: null };

  const { error } = await supabase
    .from("group_balance_entries")
    .update({ amount: Number(data.amount) + delta })
    .eq("group_id", groupId)
    .eq("user_id", userId)
    .eq("month", month);

  return { error: error?.message ?? null };
}

/** Routes a balance delta to the right pool depending on whether the item is personal or shared. */
async function adjustBalanceForItem(
  supabase: SupabaseClient<Database>,
  groupId: string | null,
  userId: string,
  delta: number
) {
  return groupId
    ? adjustGroupBalance(supabase, groupId, userId, delta)
    : adjustCurrentMonthBalance(supabase, userId, delta);
}

const itemSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  cost: z.coerce.number().min(0, "Cost can't be negative"),
  priority: z.coerce.number().int().min(1).max(5),
  productUrl: z
    .string()
    .trim()
    .url("Enter a valid link")
    .optional()
    .or(z.literal("")),
});

export async function addItem(formData: FormData) {
  const parsed = itemSchema.safeParse({
    name: formData.get("name"),
    cost: formData.get("cost"),
    priority: formData.get("priority"),
    productUrl: formData.get("productUrl"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const groupId = formData.get("groupId");

  const { supabase, user } = await requireUser();
  const { error } = await supabase.from("wishlist_items").insert({
    owner_id: user.id,
    group_id: typeof groupId === "string" && groupId ? groupId : null,
    name: parsed.data.name,
    cost: parsed.data.cost,
    priority: parsed.data.priority,
    product_url: parsed.data.productUrl || null,
    status: "wanted",
  });

  if (error) return { error: error.message };

  revalidatePath("/");
  if (typeof groupId === "string" && groupId) {
    revalidatePath(`/group/${groupId}`);
  }
  return { error: null };
}

export async function updateItem(id: string, formData: FormData) {
  const parsed = itemSchema.safeParse({
    name: formData.get("name"),
    cost: formData.get("cost"),
    priority: formData.get("priority"),
    productUrl: formData.get("productUrl"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { supabase, user } = await requireUser();

  // No owner_id filter here — RLS already allows the owner OR any group
  // member to see/update a shared item; duplicating that check app-side
  // would just block group members from editing shared items.
  const { data: existing, error: fetchError } = await supabase
    .from("wishlist_items")
    .select("cost, status, group_id, purchased_by, purchased_at")
    .eq("id", id)
    .single();

  if (fetchError) return { error: fetchError.message };

  const { error } = await supabase
    .from("wishlist_items")
    .update({
      name: parsed.data.name,
      cost: parsed.data.cost,
      priority: parsed.data.priority,
      product_url: parsed.data.productUrl || null,
    })
    .eq("id", id);

  if (error) return { error: error.message };

  // Item was already purchased and its cost changed — correct the balance
  // by the difference so the earlier deduction stays accurate. Goes to
  // whoever actually purchased it, not whoever's editing now — any
  // group member can edit a shared item, and it wasn't necessarily
  // them who paid for it. Only when purchased this month — a previous
  // month's balance is already closed out, so editing the cost now
  // shouldn't reach back and change it.
  if (existing.status === "purchased" && isCurrentMonth(existing.purchased_at)) {
    const delta = Number(existing.cost) - parsed.data.cost;
    const result = await adjustBalanceForItem(
      supabase,
      existing.group_id,
      existing.purchased_by ?? user.id,
      delta
    );
    if (result.error) return { error: result.error };
  }

  revalidatePath("/");
  if (existing.group_id) {
    revalidatePath(`/group/${existing.group_id}`);
  }
  return { error: null };
}

export async function reorderItems(orderedIds: string[], groupId?: string | null) {
  if (orderedIds.length === 0) return { error: null };

  const { supabase } = await requireUser();

  // No owner_id filter — RLS covers personal (owner) and shared
  // (group member) items alike; rows the caller can't touch just
  // silently match zero rows instead of erroring.
  const results = await Promise.all(
    orderedIds.map((id, index) =>
      supabase.from("wishlist_items").update({ priority: index + 1 }).eq("id", id)
    )
  );

  const failed = results.find((r) => r.error);
  if (failed?.error) return { error: failed.error.message };

  revalidatePath("/");
  if (groupId) {
    revalidatePath(`/group/${groupId}`);
  }
  return { error: null };
}

export async function setItemStatus(
  id: string,
  status: "wanted" | "purchased" | "deferred"
) {
  const { supabase, user } = await requireUser();

  const { data: existing, error: fetchError } = await supabase
    .from("wishlist_items")
    .select("cost, status, group_id, purchased_by, purchased_at")
    .eq("id", id)
    .single();

  if (fetchError) return { error: fetchError.message };

  const isNowPurchased = status === "purchased";
  const wasPurchased = existing.status === "purchased";

  // Reverting a purchase is only allowed for the person who bought it,
  // and only within the same month it was bought — a previous month's
  // balance is already closed out, so undoing it now has no correct
  // place to put the refund. Server-side guard: the UI hides the control
  // entirely, but this validates independently either way.
  if (wasPurchased && !isNowPurchased) {
    if (existing.purchased_by !== user.id) {
      return { error: "Only the person who bought this can undo it." };
    }
    if (!isCurrentMonth(existing.purchased_at)) {
      return {
        error: "This was purchased in a previous month and can no longer be undone.",
      };
    }
  }

  const { error } = await supabase
    .from("wishlist_items")
    .update({
      status,
      purchased_by: isNowPurchased ? user.id : null,
      purchased_at: isNowPurchased ? new Date().toISOString() : null,
    })
    .eq("id", id);

  if (error) return { error: error.message };

  const cost = Number(existing.cost);

  if (isNowPurchased && !wasPurchased) {
    // Newly bought — spend it out of the *purchaser's own* balance: their
    // personal one for a personal item, or their group entry for a
    // shared one. Contributions are the separate, explicit mechanism for
    // tracking who chipped in money toward a shared item.
    const result = await adjustBalanceForItem(
      supabase,
      existing.group_id,
      user.id,
      -cost
    );
    if (result.error) return { error: result.error };
  } else if (wasPurchased && !isNowPurchased) {
    // Un-bought — the checks above already guarantee this is the buyer,
    // undoing within the same month, so refunding into the current
    // month's balance is correct here (it's the same row it came from).
    const result = await adjustBalanceForItem(
      supabase,
      existing.group_id,
      existing.purchased_by ?? user.id,
      cost
    );
    if (result.error) return { error: result.error };
  }

  revalidatePath("/");
  if (existing.group_id) {
    revalidatePath(`/group/${existing.group_id}`);
  }
  return { error: null };
}

export async function deleteItem(id: string) {
  const { supabase, user } = await requireUser();

  const { data: existing, error: fetchError } = await supabase
    .from("wishlist_items")
    .select("cost, status, group_id, purchased_by, purchased_at")
    .eq("id", id)
    .eq("owner_id", user.id)
    .single();

  if (fetchError) return { error: fetchError.message };

  const { error } = await supabase
    .from("wishlist_items")
    .delete()
    .eq("id", id)
    .eq("owner_id", user.id);

  if (error) return { error: error.message };

  // Deleting a purchased item outright (instead of un-purchasing it first)
  // should still refund it — otherwise the balance stays short forever.
  // Refunds whoever actually purchased it (could differ from the deleter,
  // who's always the item's owner, not necessarily its buyer) and the
  // correct pool — personal or group — depending on the item. Only when
  // purchased this month, though — a previous month's balance is already
  // closed out, so deleting it now shouldn't reach back and reopen it.
  if (existing.status === "purchased" && isCurrentMonth(existing.purchased_at)) {
    const result = await adjustBalanceForItem(
      supabase,
      existing.group_id,
      existing.purchased_by ?? user.id,
      Number(existing.cost)
    );
    if (result.error) return { error: result.error };
  }

  revalidatePath("/");
  if (existing.group_id) {
    revalidatePath(`/group/${existing.group_id}`);
  }
  return { error: null };
}

const balanceSchema = z.object({
  amount: z.coerce.number().min(0, "Balance can't be negative"),
});

export async function setMonthlyBalance(formData: FormData) {
  const parsed = balanceSchema.safeParse({
    amount: formData.get("amount"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { supabase, user } = await requireUser();
  const { error } = await supabase.from("balance_entries").upsert(
    {
      user_id: user.id,
      month: currentMonthStart(),
      amount: parsed.data.amount,
    },
    { onConflict: "user_id,month" }
  );

  if (error) return { error: error.message };

  revalidatePath("/");
  return { error: null };
}

export async function setCurrency(formData: FormData) {
  const currency = String(formData.get("currency") ?? "");

  if (!isSupportedCurrency(currency)) {
    return { error: "Pick a supported currency." };
  }

  const { supabase } = await requireUser();
  const { error } = await supabase.auth.updateUser({ data: { currency } });

  if (error) return { error: error.message };

  revalidatePath("/");
  redirect("/");
}

const displayNameSchema = z.object({
  displayName: z.string().trim().min(1, "Display name is required").max(40),
});

export async function setDisplayName(formData: FormData) {
  const parsed = displayNameSchema.safeParse({
    displayName: formData.get("displayName"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { supabase, user } = await requireUser();
  const { error } = await supabase
    .from("profiles")
    .update({ display_name: parsed.data.displayName })
    .eq("id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/profile");
  revalidatePath("/group");
  return { error: null };
}

const feedbackSchema = z.object({
  overallSatisfaction: z.coerce.number().int().min(1).max(5),
  affordabilityClarity: z.coerce.number().int().min(1).max(5),
  mostUsedFeature: z.string().trim().max(200).optional(),
  confusingOrBroken: z.string().trim().max(1000).optional(),
  additionalComments: z.string().trim().max(2000).optional(),
});

export async function submitFeedback(formData: FormData) {
  const parsed = feedbackSchema.safeParse({
    overallSatisfaction: formData.get("overallSatisfaction"),
    affordabilityClarity: formData.get("affordabilityClarity"),
    mostUsedFeature: formData.get("mostUsedFeature") || undefined,
    confusingOrBroken: formData.get("confusingOrBroken") || undefined,
    additionalComments: formData.get("additionalComments") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { supabase, user } = await requireUser();
  const { error } = await supabase.from("feedback").insert({
    user_id: user.id,
    overall_satisfaction: parsed.data.overallSatisfaction,
    affordability_clarity: parsed.data.affordabilityClarity,
    most_used_feature: parsed.data.mostUsedFeature ?? null,
    confusing_or_broken: parsed.data.confusingOrBroken ?? null,
    additional_comments: parsed.data.additionalComments ?? null,
  });

  if (error) return { error: error.message };

  return { error: null };
}

export async function signOut() {
  const supabase = await createClient();
  if (!supabase) return;
  await supabase.auth.signOut();
  revalidatePath("/");
}
