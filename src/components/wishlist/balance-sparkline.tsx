"use client";

import { motion } from "motion/react";
import { formatCurrency, formatMonthLabel } from "@/lib/format";

interface BalanceSparklineProps {
  points: { month: string; amount: number }[];
  currency: string;
}

const WIDTH = 220;
const HEIGHT = 64;
const PAD_Y = 10;

export function BalanceSparkline({ points, currency }: BalanceSparklineProps) {
  if (points.length < 2) return null;

  const amounts = points.map((p) => Number(p.amount));
  const min = Math.min(...amounts);
  const max = Math.max(...amounts);
  const range = max - min || 1;

  const coords = points.map((p, i) => {
    const x = (i / (points.length - 1)) * WIDTH;
    const y =
      HEIGHT - PAD_Y - ((Number(p.amount) - min) / range) * (HEIGHT - PAD_Y * 2);
    return { x, y, month: p.month, amount: Number(p.amount) };
  });

  const linePath = coords
    .map((c, i) => `${i === 0 ? "M" : "L"} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`)
    .join(" ");
  const areaPath = `${linePath} L ${WIDTH} ${HEIGHT} L 0 ${HEIGHT} Z`;
  const last = coords[coords.length - 1];

  return (
    <div className="mt-4">
      <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        last {points.length} months
      </p>
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="mt-1.5 w-full overflow-visible"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="sparkline-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--affordable)" stopOpacity="0.25" />
            <stop offset="100%" stopColor="var(--affordable)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <motion.path
          d={areaPath}
          fill="url(#sparkline-fill)"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        />
        <motion.path
          d={linePath}
          fill="none"
          stroke="var(--affordable)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
        <circle cx={last.x} cy={last.y} r="3" fill="var(--affordable)" />
      </svg>
      <div className="mt-1 flex justify-between font-mono text-[10px] text-muted-foreground">
        <span>{formatMonthLabel(coords[0].month)}</span>
        <span className="text-foreground">
          {formatMonthLabel(last.month)} · {formatCurrency(last.amount, currency)}
        </span>
      </div>
    </div>
  );
}
