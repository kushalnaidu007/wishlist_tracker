"use client";

import { useState } from "react";
import { Reorder } from "motion/react";
import { ItemRow } from "@/components/wishlist/item-row";
import { AddItemDialog } from "@/components/wishlist/add-item-dialog";
import { PurchaseCelebration } from "@/components/wishlist/purchase-celebration";
import { reorderItems } from "@/app/actions";
import { calculateAffordability } from "@/lib/affordability";
import { isCurrentMonth } from "@/lib/format";
import type { Database } from "@/lib/supabase/database.types";

type WishlistItem = Database["public"]["Tables"]["wishlist_items"]["Row"];

interface LedgerTapeProps {
  currency: string;
  currentUserId: string;
  startingBalance: number | null;
  affordable: { item: WishlistItem; runningBalance: number }[];
  deferred: WishlistItem[];
  purchased: WishlistItem[];
  /** Group context only. */
  groupId?: string | null;
  contributionTotals?: Map<string, number>;
  purchasedByNames?: Map<string, string>;
}

/**
 * Renders the "Wanted"/"Purchased" item lists with drag-reorder and live
 * affordability recompute. Deliberately doesn't render a balance meter
 * itself — the personal dashboard and the group page each need a
 * different one (editable vs. read-only pooled), so callers render that as
 * a sibling above this.
 */
export function LedgerTape({
  currency,
  currentUserId,
  startingBalance,
  affordable,
  deferred,
  purchased,
  groupId,
  contributionTotals,
  purchasedByNames,
}: LedgerTapeProps) {
  // Flat, priority-ordered "wanted" list — the single source dragging acts on.
  const [items, setItems] = useState(() => [
    ...affordable.map((a) => a.item),
    ...deferred,
  ]);

  // Re-sync when server data changes (add/delete/purchase/edit elsewhere).
  // Adjusted during render, not in an effect, per React's guidance for
  // deriving state from props: https://react.dev/learn/you-might-not-need-an-effect
  const [prevAffordable, setPrevAffordable] = useState(affordable);
  const [prevDeferred, setPrevDeferred] = useState(deferred);
  if (affordable !== prevAffordable || deferred !== prevDeferred) {
    setPrevAffordable(affordable);
    setPrevDeferred(deferred);
    setItems([...affordable.map((a) => a.item), ...deferred]);
  }

  // Recompute the affordability split against the CURRENT drag order (not
  // the possibly-stale `priority` field) so the divider and running
  // balances update live as cards move, before the reorder is persisted.
  const liveOutcome = calculateAffordability(
    items.map((item, index) => ({
      id: item.id,
      name: item.name,
      cost: Number(item.cost),
      priority: index + 1,
    })),
    startingBalance ?? 0
  );
  const itemsById = new Map(items.map((item) => [item.id, item]));
  const liveAffordable = liveOutcome.affordable.map((result) => ({
    item: itemsById.get(result.id)!,
    runningBalance: result.runningBalance,
  }));
  const liveDeferred = liveOutcome.deferred.map(
    (result) => itemsById.get(result.id)!
  );

  function handleReorder(newIds: string[]) {
    setItems(newIds.map((id) => itemsById.get(id)!));
  }

  function persistOrder() {
    reorderItems(items.map((item) => item.id), groupId);
  }

  // Owned here, not in ItemRow — the row that handles the click unmounts
  // once the item moves from this Wanted list into the Purchased list
  // below on the next render, which would cut an in-progress celebration
  // animation off mid-flight if the state lived on that row instead.
  const [celebrating, setCelebrating] = useState(false);
  const [justPurchasedId, setJustPurchasedId] = useState<string | null>(null);

  function handleCelebrate(id: string) {
    setCelebrating(true);
    setJustPurchasedId(id);
  }

  function handleCelebrationComplete() {
    setCelebrating(false);
    setJustPurchasedId(null);
  }

  const [showPrevious, setShowPrevious] = useState(false);
  const purchasedThisMonth = purchased.filter((item) => isCurrentMonth(item.purchased_at));
  const purchasedPreviously = purchased.filter((item) => !isCurrentMonth(item.purchased_at));

  const isEmpty = items.length === 0;

  return (
    <div className="space-y-8">
      <PurchaseCelebration active={celebrating} onComplete={handleCelebrationComplete} />
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-mono text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">
            Wanted
          </h2>
          <AddItemDialog currency={currency} groupId={groupId} />
        </div>

        {isEmpty ? (
          <div className="rounded-lg border border-dashed border-border py-10 text-center">
            <p className="text-sm text-muted-foreground">
              Nothing on the list yet. Add the first thing you&apos;re saving
              for.
            </p>
          </div>
        ) : (
          <Reorder.Group
            axis="y"
            values={items.map((item) => item.id)}
            onReorder={handleReorder}
            as="div"
            className="space-y-3"
          >
            {liveAffordable.map(({ item, runningBalance }) => (
              <ItemRow
                key={item.id}
                item={item}
                currency={currency}
                currentUserId={currentUserId}
                runningBalance={runningBalance}
                contributionTotal={contributionTotals?.get(item.id)}
                draggable
                onDragEnd={persistOrder}
                onCelebrate={handleCelebrate}
              />
            ))}

            {liveDeferred.length > 0 && (
              <>
                <div className="flex items-center gap-3 py-1">
                  <span className="perforation flex-1" />
                  <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                    balance runs out here
                  </span>
                  <span className="perforation flex-1" />
                </div>
                {liveDeferred.map((item) => (
                  <ItemRow
                    key={item.id}
                    item={item}
                    currency={currency}
                    currentUserId={currentUserId}
                    carried
                    contributionTotal={contributionTotals?.get(item.id)}
                    draggable
                    onDragEnd={persistOrder}
                    onCelebrate={handleCelebrate}
                  />
                ))}
              </>
            )}
          </Reorder.Group>
        )}
      </div>

      {purchasedThisMonth.length > 0 && (
        <div>
          <h2 className="mb-3 font-mono text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">
            Purchased
          </h2>
          <div className="space-y-3">
            {purchasedThisMonth.map((item) => (
              <ItemRow
                key={item.id}
                item={item}
                currency={currency}
                currentUserId={currentUserId}
                contributionTotal={contributionTotals?.get(item.id)}
                purchasedByName={
                  item.purchased_by ? purchasedByNames?.get(item.purchased_by) : null
                }
                justPurchased={item.id === justPurchasedId}
              />
            ))}
          </div>
        </div>
      )}

      {purchasedPreviously.length > 0 && (
        <div>
          <button
            type="button"
            onClick={() => setShowPrevious((v) => !v)}
            className="mb-3 font-mono text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground transition-colors hover:text-foreground"
          >
            {showPrevious ? "Hide" : "Show"} {purchasedPreviously.length} previous purchase
            {purchasedPreviously.length === 1 ? "" : "s"}
          </button>
          {showPrevious && (
            <div className="space-y-3">
              {purchasedPreviously.map((item) => (
                <ItemRow
                  key={item.id}
                  item={item}
                  currency={currency}
                  currentUserId={currentUserId}
                  contributionTotal={contributionTotals?.get(item.id)}
                  purchasedByName={
                    item.purchased_by ? purchasedByNames?.get(item.purchased_by) : null
                  }
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
