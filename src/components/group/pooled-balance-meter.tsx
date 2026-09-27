"use client";

import { motion } from "motion/react";
import { formatCurrency, formatMonthLabel } from "@/lib/format";

interface PooledBalanceMeterProps {
  month: string;
  currency: string;
  pooledBalance: number;
  remainingBalance: number;
}

export function PooledBalanceMeter({
  month,
  currency,
  pooledBalance,
  remainingBalance,
}: PooledBalanceMeterProps) {
  const spent = Math.max(pooledBalance - remainingBalance, 0);
  const spentPct = pooledBalance ? (spent / pooledBalance) * 100 : 0;

  return (
    <div className="rounded-md border border-border bg-card p-5">
      <div className="flex items-baseline justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
            {formatMonthLabel(month)}
          </p>
          <p className="mt-1 font-mono font-tabular text-3xl font-bold tracking-tight">
            {formatCurrency(pooledBalance, currency)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            sum of everyone&apos;s group balance below — separate from
            personal balances
          </p>
        </div>

        <div className="shrink-0 text-right">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
            left after this month
          </p>
          <p className="font-mono font-tabular mt-1 text-xl font-semibold text-affordable">
            {formatCurrency(remainingBalance, currency)}
          </p>
        </div>
      </div>

      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-secondary">
        <motion.div
          className="h-full rounded-full bg-primary"
          initial={{ width: 0 }}
          animate={{ width: `${spentPct}%` }}
          transition={{ duration: 0.7, ease: "easeOut", delay: 0.1 }}
        />
      </div>
    </div>
  );
}
