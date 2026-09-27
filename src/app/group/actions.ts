"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser } from "@/app/actions";
import { getGroupMembers, getGroupMembership } from "@/lib/data";
import { currentMonthStart } from "@/lib/format";

const nameSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(80),
});

export async function createGroup(formData: FormData) {
  const parsed = nameSchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { supabase, user } = await requireUser();

  const { data: group, error: groupError } = await supabase
    .from("groups")
    .insert({ name: parsed.data.name, created_by: user.id })
    .select("id")
    .single();

  if (groupError) return { error: groupError.message };

  const { error: memberError } = await supabase.from("group_members").insert({
    group_id: group.id,
    user_id: user.id,
    role: "owner",
  });

  if (memberError) return { error: memberError.message };

  revalidatePath("/group");
  redirect(`/group/${group.id}`);
}

export async function createInvite(groupId: string) {
  const { supabase, user } = await requireUser();

  const group = await getGroupMembership(supabase, user.id, groupId);
  if (!group) {
    return { error: "You're not in this group.", id: null };
  }

  const { data, error } = await supabase
    .from("group_invites")
    .insert({
      group_id: groupId,
      group_name: group.name,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error) return { error: error.message, id: null };

  return { error: null, id: data.id };
}

export async function joinGroup(inviteId: string) {
  const { supabase, user } = await requireUser();

  const { data: invite, error: inviteError } = await supabase
    .from("group_invites")
    .select("group_id, expires_at")
    .eq("id", inviteId)
    .maybeSingle();

  if (inviteError) return { error: inviteError.message };
  if (!invite) return { error: "This invite link is invalid." };
  if (new Date(invite.expires_at) < new Date()) {
    return { error: "This invite link has expired." };
  }

  const existing = await getGroupMembership(supabase, user.id, invite.group_id);
  if (existing) {
    redirect(`/group/${invite.group_id}`);
  }

  const { error: joinError } = await supabase.from("group_members").insert({
    group_id: invite.group_id,
    user_id: user.id,
    role: "member",
  });

  if (joinError) return { error: joinError.message };

  revalidatePath("/group");
  redirect(`/group/${invite.group_id}`);
}

const contributionSchema = z.object({
  amount: z.coerce.number().positive("Amount must be greater than 0"),
});

export async function addContribution(itemId: string, formData: FormData) {
  const parsed = contributionSchema.safeParse({ amount: formData.get("amount") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { supabase, user } = await requireUser();

  const { data: item, error: itemError } = await supabase
    .from("wishlist_items")
    .select("group_id")
    .eq("id", itemId)
    .single();
  if (itemError) return { error: itemError.message };
  if (!item.group_id) return { error: "This item isn't part of a group." };

  const group = await getGroupMembership(supabase, user.id, item.group_id);
  if (!group) return { error: "You're not in this group." };

  const { error } = await supabase.from("contributions").insert({
    wishlist_item_id: itemId,
    group_member_id: group.membershipId,
    amount: parsed.data.amount,
  });

  if (error) return { error: error.message };

  revalidatePath(`/group/${item.group_id}`);
  return { error: null };
}

const groupBalanceSchema = z.object({
  amount: z.coerce.number().min(0, "Balance can't be negative"),
});

export async function setGroupBalance(groupId: string, formData: FormData) {
  const parsed = groupBalanceSchema.safeParse({
    amount: formData.get("amount"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { supabase, user } = await requireUser();

  const group = await getGroupMembership(supabase, user.id, groupId);
  if (!group) return { error: "You're not in this group." };

  const { error } = await supabase.from("group_balance_entries").upsert(
    {
      group_id: groupId,
      user_id: user.id,
      month: currentMonthStart(),
      amount: parsed.data.amount,
    },
    { onConflict: "group_id,user_id,month" }
  );

  if (error) return { error: error.message };

  revalidatePath(`/group/${groupId}`);
  return { error: null };
}

export async function leaveGroup(groupId: string) {
  const { supabase, user } = await requireUser();

  const group = await getGroupMembership(supabase, user.id, groupId);
  if (!group) return { error: "You're not in this group." };

  const members = await getGroupMembers(supabase, group.id);
  const others = members.filter((m) => m.user_id !== user.id);

  // Fall your own group items back to personal before you lose access
  // via membership — owner_id still covers this update regardless of
  // whether you're still a member by the time it runs.
  const { error: itemsError } = await supabase
    .from("wishlist_items")
    .update({ group_id: null })
    .eq("owner_id", user.id)
    .eq("group_id", group.id);

  if (itemsError) return { error: itemsError.message };

  if (others.length > 0) {
    if (group.role === "owner") {
      // getGroupMembers orders by joined_at ascending — the first of
      // "others" is the longest-tenured remaining member.
      const nextOwner = others[0];
      const { error: promoteError } = await supabase
        .from("group_members")
        .update({ role: "owner" })
        .eq("id", nextOwner.id);
      if (promoteError) return { error: promoteError.message };
    }

    const { error: leaveError } = await supabase
      .from("group_members")
      .delete()
      .eq("id", group.membershipId);
    if (leaveError) return { error: leaveError.message };
  } else {
    // Last member out — delete the group. Cascades to
    // group_members and group_invites; the item reassignment
    // above already happened, so nothing else references it.
    const { error: deleteError } = await supabase
      .from("groups")
      .delete()
      .eq("id", group.id);
    if (deleteError) return { error: deleteError.message };
  }

  revalidatePath("/group");
  revalidatePath("/");
  redirect("/group");
}

export async function removeMember(memberId: string) {
  const { supabase, user } = await requireUser();

  const { data: target, error: targetError } = await supabase
    .from("group_members")
    .select("id, user_id, group_id")
    .eq("id", memberId)
    .single();
  if (targetError) return { error: targetError.message };

  const group = await getGroupMembership(supabase, user.id, target.group_id);
  if (!group) return { error: "You're not in this group." };
  if (group.role !== "owner") {
    return { error: "Only the owner can remove members." };
  }
  if (memberId === group.membershipId) {
    return { error: 'Use "Leave group" to remove yourself.' };
  }

  const { error: itemsError } = await supabase
    .from("wishlist_items")
    .update({ group_id: null })
    .eq("owner_id", target.user_id)
    .eq("group_id", group.id);
  if (itemsError) return { error: itemsError.message };

  const { error } = await supabase
    .from("group_members")
    .delete()
    .eq("id", memberId);
  if (error) return { error: error.message };

  revalidatePath(`/group/${group.id}`);
  return { error: null };
}

export async function transferOwnership(newOwnerMemberId: string) {
  const { supabase, user } = await requireUser();

  const { data: target, error: targetError } = await supabase
    .from("group_members")
    .select("id, group_id")
    .eq("id", newOwnerMemberId)
    .single();
  if (targetError) return { error: targetError.message };

  const group = await getGroupMembership(supabase, user.id, target.group_id);
  if (!group) return { error: "You're not in this group." };
  if (group.role !== "owner") {
    return { error: "Only the owner can transfer ownership." };
  }
  if (newOwnerMemberId === group.membershipId) {
    return { error: "You're already the owner." };
  }

  // Promote the new owner *before* demoting yourself — the RLS policy for
  // updating group_members roles requires the caller to currently be
  // the owner, so doing this in the other order would lose that privilege
  // partway through and silently block the second update.
  const { error: promoteError } = await supabase
    .from("group_members")
    .update({ role: "owner" })
    .eq("id", newOwnerMemberId);
  if (promoteError) return { error: promoteError.message };

  const { error: demoteError } = await supabase
    .from("group_members")
    .update({ role: "member" })
    .eq("id", group.membershipId);
  if (demoteError) return { error: demoteError.message };

  revalidatePath(`/group/${group.id}`);
  return { error: null };
}
