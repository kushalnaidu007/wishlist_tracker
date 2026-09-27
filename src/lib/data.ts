import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { currentMonthStart } from "@/lib/format";

type Client = SupabaseClient<Database>;

export async function getWishlistItems(client: Client, userId: string) {
  const { data, error } = await client
    .from("wishlist_items")
    .select("*")
    .eq("owner_id", userId)
    .order("priority", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data;
}

export async function getCurrentMonthBalance(client: Client, userId: string) {
  const { data, error } = await client
    .from("balance_entries")
    .select("amount")
    .eq("user_id", userId)
    .eq("month", currentMonthStart())
    .maybeSingle();

  if (error) throw error;
  return data?.amount ?? null;
}

export async function getRecentBalanceTrend(
  client: Client,
  userId: string,
  months = 6
) {
  const { data, error } = await client
    .from("balance_entries")
    .select("month, amount")
    .eq("user_id", userId)
    .order("month", { ascending: false })
    .limit(months);

  if (error) throw error;
  return [...data].reverse();
}

/** Every group a user belongs to — powers the group index page and the header switcher. */
export async function getUserGroups(client: Client, userId: string) {
  const { data: memberships, error: membershipError } = await client
    .from("group_members")
    .select("id, group_id, role")
    .eq("user_id", userId)
    .order("joined_at", { ascending: true });

  if (membershipError) throw membershipError;
  if (memberships.length === 0) return [];

  // Two queries + a Map merge, same pattern as getProfiles below — no FK
  // PostgREST can embed-select through here without a generated-types pass.
  const { data: groups, error: groupsError } = await client
    .from("groups")
    .select("id, name")
    .in(
      "id",
      memberships.map((m) => m.group_id)
    );

  if (groupsError) throw groupsError;
  const namesById = new Map(groups.map((g) => [g.id, g.name]));

  return memberships.map((m) => ({
    id: m.group_id,
    name: namesById.get(m.group_id) ?? "Unknown group",
    membershipId: m.id,
    role: m.role,
  }));
}

/** The caller's membership in one specific group, or null if they're not in it. */
export async function getGroupMembership(
  client: Client,
  userId: string,
  groupId: string
) {
  const { data: membership, error: membershipError } = await client
    .from("group_members")
    .select("id, role")
    .eq("user_id", userId)
    .eq("group_id", groupId)
    .maybeSingle();

  if (membershipError) throw membershipError;
  if (!membership) return null;

  const { data: group, error: groupError } = await client
    .from("groups")
    .select("id, name, created_by")
    .eq("id", groupId)
    .single();

  if (groupError) throw groupError;

  return {
    id: group.id,
    name: group.name,
    createdBy: group.created_by,
    membershipId: membership.id,
    role: membership.role,
  };
}

export async function getGroupMembers(client: Client, groupId: string) {
  const { data, error } = await client
    .from("group_members")
    .select("*")
    .eq("group_id", groupId)
    .order("joined_at", { ascending: true });

  if (error) throw error;
  return data;
}

export async function getGroupItems(client: Client, groupId: string) {
  const { data, error } = await client
    .from("wishlist_items")
    .select("*")
    .eq("group_id", groupId)
    .order("priority", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data;
}

/**
 * Raw per-member rows for the current month — separate from personal
 * balance_entries entirely. Callers sum for the pooled total and/or use
 * the individual rows for a per-member breakdown.
 */
export async function getGroupBalanceEntries(
  client: Client,
  groupId: string
) {
  const { data, error } = await client
    .from("group_balance_entries")
    .select("user_id, amount")
    .eq("group_id", groupId)
    .eq("month", currentMonthStart());

  if (error) throw error;
  return data;
}

export async function getContributionTotals(client: Client, itemIds: string[]) {
  const totals = new Map<string, number>();
  if (itemIds.length === 0) return totals;

  const { data, error } = await client
    .from("contributions")
    .select("wishlist_item_id, amount")
    .in("wishlist_item_id", itemIds);

  if (error) throw error;

  for (const row of data) {
    totals.set(
      row.wishlist_item_id,
      (totals.get(row.wishlist_item_id) ?? 0) + Number(row.amount)
    );
  }
  return totals;
}

/** id -> display name (never the raw email — that's what this exists to avoid showing). */
export async function getProfiles(client: Client, userIds: string[]) {
  const names = new Map<string, string>();
  if (userIds.length === 0) return names;

  const { data, error } = await client
    .from("profiles")
    .select("id, display_name")
    .in("id", userIds);

  if (error) throw error;

  for (const row of data) {
    names.set(row.id, row.display_name);
  }
  return names;
}
