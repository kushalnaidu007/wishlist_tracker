"use client";

import { useState, useTransition } from "react";
import { motion } from "motion/react";
import { Check, Pencil, X } from "lucide-react";
import { setMonthlyBalance } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BalanceSparkline } from "@/components/wishlist/balance-sparkline";
import { formatCurrency, formatMonthLabel } from "@/lib/format";

interface BalanceMeterProps {
  month: string;
  currency: string;
  startingBalance: number | null;
  remainingBalance: number;
  trend: { month: string; amount: number }[];
}

export function BalanceMeter({
  month,
  currency,
  startingBalance,
  remainingBalance,
  trend,
}: BalanceMeterProps) {
  const hasBalance = startingBalance !== null;
  const [isEditing, setIsEditing] = useState(!hasBalance);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const spent = Math.max((startingBalance ?? 0) - remainingBalance, 0);
  const spentPct = startingBalance ? (spent / startingBalance) * 100 : 0;

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await setMonthlyBalance(formData);
      if (result?.error) {
        setError(result.error);
        return;
      }
      setIsEditing(false);
    });
  }

  return (
    <div className="rounded-md border border-border bg-card p-5">
      <div className="flex items-baseline justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
            {formatMonthLabel(month)}
          </p>

          {isEditing ? (
            <form action={handleSubmit} className="mt-1.5 flex items-center gap-2">
              <Input
                name="amount"
                type="number"
                inputMode="decimal"
                min={0}
                step={0.01}
                required
                autoFocus
                defaultValue={startingBalance ?? undefined}
                placeholder="0.00"
                className="w-40 font-mono text-lg"
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
              {hasBalance && (
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
          ) : (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="group mt-1 flex items-center gap-2 font-mono font-tabular text-3xl font-bold tracking-tight"
            >
              {formatCurrency(hasBalance ? startingBalance : 0, currency)}
              <Pencil className="size-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
            </button>
          )}

          {error && <p className="mt-1.5 text-sm text-destructive">{error}</p>}
        </div>

        {hasBalance && !isEditing && (
          <div className="shrink-0 text-right">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
              left after this month
            </p>
            <p className="font-mono font-tabular mt-1 text-xl font-semibold text-affordable">
              {formatCurrency(remainingBalance, currency)}
            </p>
          </div>
        )}
      </div>

      {hasBalance && !isEditing && (
        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-secondary">
          <motion.div
            className="h-full rounded-full bg-primary"
            initial={{ width: 0 }}
            animate={{ width: `${spentPct}%` }}
            transition={{ duration: 0.7, ease: "easeOut", delay: 0.1 }}
          />
        </div>
      )}

      {!isEditing && <BalanceSparkline points={trend} currency={currency} />}
    </div>
  );
}
