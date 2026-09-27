import { SiteHeader } from "@/components/site-header";
import { SetupNotice } from "@/components/setup-notice";
import { PageLetterhead } from "@/components/page-letterhead";
import { MarketingHome } from "@/components/marketing/marketing-home";
import { LedgerTape } from "@/components/wishlist/ledger-tape";
import { BalanceMeter } from "@/components/wishlist/balance-meter";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import {
  getCurrentMonthBalance,
  getRecentBalanceTrend,
  getWishlistItems,
} from "@/lib/data";
import { calculateAffordability } from "@/lib/affordability";
import { currentMonthStart } from "@/lib/format";
import { getUserCurrency } from "@/lib/currency";

export default async function DashboardPage() {
  if (!isSupabaseConfigured) {
    return <SetupNotice />;
  }

  const supabase = await createClient();
  if (!supabase) return <SetupNotice />;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return <MarketingHome />;

  const [items, balance, trend] = await Promise.all([
    getWishlistItems(supabase, user.id),
    getCurrentMonthBalance(supabase, user.id),
    getRecentBalanceTrend(supabase, user.id),
  ]);

  const wanted = items.filter((item) => item.status === "wanted");
  const purchased = items.filter((item) => item.status === "purchased");

  const outcome = calculateAffordability(
    wanted.map((item) => ({
      id: item.id,
      name: item.name,
      cost: Number(item.cost),
      priority: item.priority,
    })),
    balance ?? 0
  );

  const itemsById = new Map(wanted.map((item) => [item.id, item]));
  const affordable = outcome.affordable.map((result) => ({
    item: itemsById.get(result.id)!,
    runningBalance: result.runningBalance,
  }));
  const deferred = outcome.deferred
    .map((result) => itemsById.get(result.id)!)
    .filter(Boolean);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-3xl space-y-8 px-4 py-8 sm:px-6">
        <PageLetterhead eyebrow="Personal" title="Wishlist" />
        <BalanceMeter
          month={currentMonthStart()}
          currency={getUserCurrency(user)}
          startingBalance={balance}
          remainingBalance={outcome.remainingBalance}
          trend={trend}
        />
        <LedgerTape
          currency={getUserCurrency(user)}
          currentUserId={user.id}
          startingBalance={balance}
          affordable={affordable}
          deferred={deferred}
          purchased={purchased}
        />
      </main>
    </div>
  );
}
