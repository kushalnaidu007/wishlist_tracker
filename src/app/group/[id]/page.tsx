import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { SetupNotice } from "@/components/setup-notice";
import { PageLetterhead } from "@/components/page-letterhead";
import { InviteLinkCard } from "@/components/group/invite-link-card";
import { MemberList } from "@/components/group/member-list";
import { PooledBalanceMeter } from "@/components/group/pooled-balance-meter";
import { GroupBalanceBreakdown } from "@/components/group/group-balance-breakdown";
import { LedgerTape } from "@/components/wishlist/ledger-tape";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import {
  getContributionTotals,
  getGroupBalanceEntries,
  getGroupItems,
  getGroupMembers,
  getGroupMembership,
  getProfiles,
} from "@/lib/data";
import { calculateAffordability } from "@/lib/affordability";
import { currentMonthStart } from "@/lib/format";
import { getUserCurrency } from "@/lib/currency";

export default async function GroupDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!isSupabaseConfigured) {
    return <SetupNotice />;
  }

  const supabase = await createClient();
  if (!supabase) return <SetupNotice />;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { id } = await params;
  const group = await getGroupMembership(supabase, user.id, id);
  if (!group) redirect("/group");

  const members = await getGroupMembers(supabase, group.id);
  const memberUserIds = members.map((m) => m.user_id);

  const [items, balanceEntries, displayNames] = await Promise.all([
    getGroupItems(supabase, group.id),
    getGroupBalanceEntries(supabase, group.id),
    getProfiles(supabase, memberUserIds),
  ]);

  const balanceByUserId = new Map(balanceEntries.map((e) => [e.user_id, Number(e.amount)]));
  const pooledBalance = balanceEntries.reduce((sum, e) => sum + Number(e.amount), 0);

  const breakdownEntries = members.map((m) => ({
    userId: m.user_id,
    displayName: displayNames.get(m.user_id) ?? m.user_id,
    amount: balanceByUserId.get(m.user_id) ?? null,
  }));

  const wanted = items.filter((item) => item.status === "wanted");
  const purchased = items.filter((item) => item.status === "purchased");

  const outcome = calculateAffordability(
    wanted.map((item) => ({
      id: item.id,
      name: item.name,
      cost: Number(item.cost),
      priority: item.priority,
    })),
    pooledBalance
  );

  const itemsById = new Map(wanted.map((item) => [item.id, item]));
  const affordable = outcome.affordable.map((result) => ({
    item: itemsById.get(result.id)!,
    runningBalance: result.runningBalance,
  }));
  const deferred = outcome.deferred
    .map((result) => itemsById.get(result.id)!)
    .filter(Boolean);

  const contributionTotals = await getContributionTotals(
    supabase,
    items.map((item) => item.id)
  );

  const memberList = members.map((m) => ({
    id: m.id,
    userId: m.user_id,
    role: m.role,
    displayName: displayNames.get(m.user_id) ?? m.user_id,
  }));

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-3xl space-y-8 px-4 py-8 sm:px-6">
        <PageLetterhead eyebrow="Group" title={group.name} />

        <PooledBalanceMeter
          month={currentMonthStart()}
          currency={getUserCurrency(user)}
          pooledBalance={pooledBalance}
          remainingBalance={outcome.remainingBalance}
        />

        <GroupBalanceBreakdown
          groupId={group.id}
          currency={getUserCurrency(user)}
          entries={breakdownEntries}
          currentUserId={user.id}
        />

        <LedgerTape
          currency={getUserCurrency(user)}
          currentUserId={user.id}
          startingBalance={pooledBalance}
          affordable={affordable}
          deferred={deferred}
          purchased={purchased}
          groupId={group.id}
          contributionTotals={contributionTotals}
          purchasedByNames={displayNames}
        />

        <MemberList
          members={memberList}
          currentUserId={user.id}
          isOwner={group.role === "owner"}
          groupId={group.id}
        />

        <InviteLinkCard groupId={group.id} />
      </main>
    </div>
  );
}
