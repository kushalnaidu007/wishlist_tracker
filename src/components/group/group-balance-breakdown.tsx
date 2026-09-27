"use client";

import { useState, useTransition } from "react";
import { Check, Pencil, X } from "lucide-react";
import { setGroupBalance } from "@/app/group/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserAvatar } from "@/components/profile/user-avatar";
import { formatCurrency } from "@/lib/format";

interface BreakdownEntry {
  userId: string;
  displayName: string;
  amount: number | null;
}

export function GroupBalanceBreakdown({
  groupId,
  currency,
  entries,
  currentUserId,
}: {
  groupId: string;
  currency: string;
  entries: BreakdownEntry[];
  currentUserId: string;
}) {
  const ownEntry = entries.find((entry) => entry.userId === currentUserId);
  const [isEditing, setIsEditing] = useState(ownEntry?.amount == null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await setGroupBalance(groupId, formData);
      if (result?.error) {
        setError(result.error);
        return;
      }
      setIsEditing(false);
    });
  }

  return (
    <div className="rounded-md border border-border bg-card p-5">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
        Balances
      </p>
      <div className="mt-3 space-y-3">
        {entries.map((entry) => {
          const isSelf = entry.userId === currentUserId;
          return (
            <div key={entry.userId} className="flex items-center gap-3">
              <UserAvatar label={entry.displayName} className="size-9 text-sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {entry.displayName}
                  {isSelf && <span className="text-muted-foreground"> (you)</span>}
                </p>
              </div>

              {isSelf && isEditing ? (
                <form action={handleSubmit} className="flex shrink-0 items-center gap-1.5">
                  <Input
                    name="amount"
                    type="number"
                    inputMode="decimal"
                    min={0}
                    step={0.01}
                    required
                    autoFocus
                    defaultValue={entry.amount ?? undefined}
                    placeholder="0.00"
                    className="w-28 font-mono text-sm"
                  />
                  <Button
                    type="submit"
                    size="icon"
                    variant="ghost"
                    disabled={isPending}
                    aria-label="Save balance"
                  >
                    <Check className="size-4" />
                  </Button>
                  {entry.amount !== null && (
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      disabled={isPending}
                      aria-label="Cancel"
                      onClick={() => setIsEditing(false)}
                    >
                      <X className="size-4" />
                    </Button>
                  )}
                </form>
              ) : isSelf ? (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="group flex shrink-0 items-center gap-1.5 font-mono text-sm font-tabular"
                >
                  {formatCurrency(entry.amount ?? 0, currency)}
                  <Pencil className="size-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                </button>
              ) : (
                <span className="shrink-0 font-mono text-sm font-tabular text-muted-foreground">
                  {entry.amount !== null ? formatCurrency(entry.amount, currency) : "not set"}
                </span>
              )}
            </div>
          );
        })}
      </div>
      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
    </div>
  );
}
