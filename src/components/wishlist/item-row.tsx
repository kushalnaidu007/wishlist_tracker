"use client";

import { useState, useTransition } from "react";
import { motion, Reorder, useDragControls } from "motion/react";
import {
  ArrowUpRight,
  Check,
  GripVertical,
  Pencil,
  RotateCcw,
  Trash2,
  X,
} from "lucide-react";
import { deleteItem, setItemStatus, updateItem } from "@/app/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusStamp } from "@/components/wishlist/status-stamp";
import { ItemIconBadge } from "@/components/wishlist/item-icon-badge";
import { ContributeDialog } from "@/components/group/contribute-dialog";
import { formatCurrency, isCurrentMonth } from "@/lib/format";
import { getProductDomain, getProductLink } from "@/lib/product-link";
import { PRIORITIES } from "@/lib/priority";
import { cn } from "@/lib/utils";
import type { AffordabilityResult } from "@/lib/affordability";
import type { Database } from "@/lib/supabase/database.types";

type WishlistItem = Database["public"]["Tables"]["wishlist_items"]["Row"];

interface ItemRowProps {
  item: WishlistItem;
  currency: string;
  currentUserId: string;
  runningBalance?: AffordabilityResult["runningBalance"];
  carried?: boolean;
  /** Group context only — presence (even 0) signals to show the contribution row. */
  contributionTotal?: number;
  /** Group context only — shown next to the purchased stamp. */
  purchasedByName?: string | null;
  /** Enables drag-to-reorder. Only meaningful inside a Reorder.Group. */
  draggable?: boolean;
  onDragEnd?: () => void;
  /**
   * Called right when the user clicks "mark as purchased" — owned by the
   * parent (LedgerTape), not local state, because this exact row instance
   * unmounts once the item moves from the Wanted section into the
   * Purchased section on the next render, which would otherwise cut off
   * an in-progress celebration animation mid-flight.
   */
  onCelebrate?: (id: string) => void;
  /** True only for the single row that was just marked purchased this session — plays the stamp's slam-in animation instead of rendering it plain. */
  justPurchased?: boolean;
}

const CARD_CLASSNAME =
  "group flex items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-sm transition-shadow hover:shadow-md";

export function ItemRow({
  item,
  currency,
  currentUserId,
  runningBalance,
  carried,
  contributionTotal,
  purchasedByName,
  draggable,
  onDragEnd,
  onCelebrate,
  justPurchased,
}: ItemRowProps) {
  const [isPending, startTransition] = useTransition();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(item.name);
  const [error, setError] = useState<string | null>(null);
  const dragControls = useDragControls();
  const purchased = item.status === "purchased";
  const canRevert =
    purchased && item.purchased_by === currentUserId && isCurrentMonth(item.purchased_at);
  const productLink = getProductLink(item.product_url);
  const productDomain = getProductDomain(item.product_url);

  function openEdit() {
    setName(item.name);
    setError(null);
    setIsEditing(true);
  }

  function handleSave(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await updateItem(item.id, formData);
      if (result?.error) {
        setError(result.error);
        return;
      }
      setIsEditing(false);
    });
  }

  if (isEditing) {
    return (
      <motion.div
        layout
        className="rounded-xl border border-primary bg-card p-4 shadow-sm"
      >
        <form action={handleSave} className="space-y-3">
          <div className="flex items-center gap-2.5">
            <ItemIconBadge name={name} className="size-9 shrink-0" />
            <Input
              name="name"
              required
              maxLength={120}
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="min-w-0"
            />
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <Input
              name="cost"
              type="number"
              inputMode="decimal"
              min={0}
              step={0.01}
              required
              defaultValue={Number(item.cost)}
              className="font-mono"
              aria-label={`Cost (${currency})`}
            />
            <Select name="priority" defaultValue={String(item.priority)}>
              <SelectTrigger className="w-full" aria-label="Priority">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PRIORITIES.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Input
            name="productUrl"
            type="url"
            defaultValue={item.product_url ?? ""}
            placeholder="Product link (optional)"
            aria-label="Product link"
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={isPending}
              onClick={() => setIsEditing(false)}
            >
              <X className="size-4" />
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={isPending}>
              <Check className="size-4" />
              {isPending ? "Saving…" : "Save"}
            </Button>
          </div>
        </form>
      </motion.div>
    );
  }

  const showContributions = contributionTotal !== undefined;
  const contributionPct = showContributions
    ? Math.min((contributionTotal! / Math.max(Number(item.cost), 0.01)) * 100, 100)
    : 0;

  const content = (
    <>
      {draggable && (
        <span
          role="button"
          aria-label="Drag to reorder"
          tabIndex={-1}
          onPointerDown={(e) => dragControls.start(e)}
          className="shrink-0 cursor-grab touch-none text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 active:cursor-grabbing"
        >
          <GripVertical className="size-4" />
        </span>
      )}

      <ItemIconBadge
        name={item.name}
        className={purchased ? "opacity-50 grayscale" : undefined}
      />

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 items-center gap-1.5">
              <p
                className={cn(
                  "truncate text-sm font-medium",
                  purchased && "text-muted-foreground line-through"
                )}
              >
                {item.name}
              </p>
              {productLink && productDomain && (
                <Badge variant="outline" asChild className="shrink-0 font-mono">
                  <a
                    href={productLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    onPointerDown={(e) => e.stopPropagation()}
                  >
                    {productDomain}
                    <ArrowUpRight data-icon="inline-end" />
                  </a>
                </Badge>
              )}
            </div>
            {purchased ? (
              <div className="mt-1 flex items-center gap-2">
                {justPurchased ? (
                  <motion.span
                    initial={{ scale: 1.8, rotate: -30, opacity: 0 }}
                    animate={{ scale: 1, rotate: 0, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 15 }}
                  >
                    <StatusStamp />
                  </motion.span>
                ) : (
                  <StatusStamp />
                )}
                {purchasedByName && (
                  <span className="truncate font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
                    by {purchasedByName}
                  </span>
                )}
              </div>
            ) : carried ? (
              <p className="mt-0.5 font-mono text-[11px] uppercase tracking-wide text-deferred-foreground">
                carried to next month
              </p>
            ) : (
              <p className="mt-0.5 font-mono text-[11px] uppercase tracking-wide text-muted-foreground">
                priority {item.priority}
              </p>
            )}
          </div>

          <div className="flex items-center gap-3 font-mono text-sm font-tabular">
            <span className={purchased ? "text-muted-foreground" : "text-foreground"}>
              {formatCurrency(Number(item.cost), currency)}
            </span>
            {runningBalance !== undefined && (
              <span className="hidden text-affordable sm:inline">
                {formatCurrency(runningBalance, currency)}
              </span>
            )}
          </div>

          <div
            className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100"
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <Button
              variant="ghost"
              size="icon"
              aria-label="Edit item"
              disabled={isPending}
              onClick={openEdit}
            >
              <Pencil className="size-4" />
            </Button>
            {purchased ? (
              canRevert && (
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Mark as wanted again"
                  disabled={isPending}
                  onClick={() =>
                    startTransition(() => {
                      setItemStatus(item.id, "wanted");
                    })
                  }
                >
                  <RotateCcw className="size-4" />
                </Button>
              )
            ) : (
              <Button
                variant="ghost"
                size="icon"
                aria-label="Mark as purchased"
                disabled={isPending}
                onClick={() => {
                  onCelebrate?.(item.id);
                  startTransition(() => {
                    setItemStatus(item.id, "purchased");
                  });
                }}
              >
                <Check className="size-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              aria-label="Delete item"
              disabled={isPending}
              onClick={() =>
                startTransition(() => {
                  deleteItem(item.id);
                })
              }
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        </div>

        {showContributions && (
          <div
            className="mt-2 flex items-center gap-3"
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <div className="min-w-0 flex-1">
              <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full rounded-full bg-affordable transition-[width]"
                  style={{ width: `${contributionPct}%` }}
                />
              </div>
              <p className="mt-1 font-mono text-[11px] text-muted-foreground">
                {formatCurrency(contributionTotal!, currency)} raised of{" "}
                {formatCurrency(Number(item.cost), currency)}
              </p>
            </div>
            <ContributeDialog itemId={item.id} itemName={item.name} currency={currency} />
          </div>
        )}
      </div>
    </>
  );

  if (draggable) {
    return (
      <Reorder.Item
        value={item.id}
        dragListener={false}
        dragControls={dragControls}
        onDragEnd={onDragEnd}
        onClick={openEdit}
        className={cn(CARD_CLASSNAME, "cursor-pointer")}
      >
        {content}
      </Reorder.Item>
    );
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: isPending ? 0.5 : 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      onClick={openEdit}
      className={cn(CARD_CLASSNAME, "cursor-pointer")}
    >
      {content}
    </motion.div>
  );
}
