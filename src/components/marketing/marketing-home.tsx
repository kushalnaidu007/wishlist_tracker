"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { ListOrdered, Users, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { ItemIconBadge } from "@/components/wishlist/item-icon-badge";
import { formatCurrency } from "@/lib/format";
import { tornEdgeClipPath } from "@/lib/torn-edge";

const TORN_EDGE_CLIP_PATH = tornEdgeClipPath(14, 45);

/** Used top and bottom of the receipt card. Rotate 180° for the top edge. */
function TornEdge({ flip }: { flip?: boolean }) {
  return (
    <div
      aria-hidden
      className={`h-3 w-full bg-card ${flip ? "rotate-180" : ""}`}
      style={{ clipPath: TORN_EDGE_CLIP_PATH }}
    />
  );
}

const LEDGER_ITEMS = [
  { name: "Headphones", priority: 1, cost: 180, fits: true },
  { name: "Armchair", priority: 2, cost: 340, fits: true },
  { name: "Flight to Lisbon", priority: 3, cost: 260, fits: false },
];
const BALANCE = 600;

const FEATURES = [
  {
    icon: ListOrdered,
    label: "Priority ordering",
    description:
      "Add what you want, rank it, and drag to reorder the moment your mind changes.",
  },
  {
    icon: Wallet,
    label: "Real affordability",
    description:
      "Enter your actual balance and watch it split into what fits now and what has to wait.",
  },
  {
    icon: Users,
    label: "Group pooling",
    description:
      "Share the list with your household. Everyone chips in, everyone sees the same total.",
  },
];

export function MarketingHome() {
  const reduceMotion = useReducedMotion();

  // For content inside the hero receipt — already on screen at load, so it
  // animates once on mount. whileInView is wrong here: it depends on an
  // IntersectionObserver callback firing before first paint, which isn't
  // guaranteed for elements already in the viewport, and left the balance
  // row (the most important number on the page) silently stuck at
  // opacity 0 in testing.
  const revealOnMount = (delay = 0) =>
    reduceMotion
      ? {}
      : {
          initial: { opacity: 0, y: 10 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.4, ease: "easeOut" as const, delay },
        };

  // For sections below the fold — safe to defer until scrolled into view.
  const revealOnScroll = (delay = 0) =>
    reduceMotion
      ? {}
      : {
          initial: { opacity: 0, y: 10 },
          whileInView: { opacity: 1, y: 0 },
          viewport: { once: true, margin: "-60px" },
          transition: { duration: 0.4, ease: "easeOut" as const, delay },
        };

  const remaining =
    BALANCE - LEDGER_ITEMS.filter((item) => item.fits).reduce((sum, item) => sum + item.cost, 0);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b border-border bg-background">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4 sm:px-6">
          <span className="font-sans text-xl font-bold tracking-tight">Wishpri</span>
          <nav className="flex items-center gap-3">
            <Link
              href="/login"
              className="rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              Sign in
            </Link>
            <Button size="sm" asChild>
              <Link href="/login">Get started</Link>
            </Button>
            <ThemeToggle />
          </nav>
        </div>
      </header>

      <main className="px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-[480px]">
          {/* The receipt */}
          <motion.div
            initial={reduceMotion ? undefined : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="drop-shadow-[0_8px_20px_rgb(0,0,0,0.12)]"
          >
            <TornEdge />
            <div className="bg-card px-6 py-8 sm:px-8">
              <div className="text-center">
                <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                  Itemized &middot; Prioritized &middot; Pooled
                </p>
                <h1 className="mt-3 font-heading text-3xl tracking-tight sm:text-4xl">
                  Wishpri
                </h1>
                <p className="mx-auto mt-2 max-w-xs text-sm text-muted-foreground">
                  Track what you want against what you actually have.
                </p>
              </div>

              <div className="mt-8">
                <span className="perforation block" />
                <div className="mt-6 flex justify-between font-mono text-[11px] uppercase tracking-[0.15em] text-muted-foreground">
                  <span>Item</span>
                  <span>Amount</span>
                </div>

                <div className="mt-3 space-y-3">
                  {LEDGER_ITEMS.map((item, i) => {
                    const showDivider = !item.fits && LEDGER_ITEMS[i - 1]?.fits;
                    return (
                      <div key={item.name}>
                        {showDivider && (
                          <motion.div {...revealOnMount()} className="my-4 flex items-center gap-2">
                            <span className="perforation flex-1" />
                            <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                              balance runs out
                            </span>
                            <span className="perforation flex-1" />
                          </motion.div>
                        )}
                        <motion.div
                          {...revealOnMount(0.1 + i * 0.08)}
                          className="flex items-center gap-3"
                        >
                          <ItemIconBadge
                            name={item.name}
                            className={item.fits ? "size-8" : "size-8 opacity-50 grayscale"}
                          />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">{item.name}</p>
                            <p className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
                              {item.fits ? `priority ${item.priority}` : "carried to next month"}
                            </p>
                          </div>
                          <span className="font-mono text-sm font-tabular text-muted-foreground">
                            {formatCurrency(item.cost, "USD")}
                          </span>
                        </motion.div>
                      </div>
                    );
                  })}
                </div>

                <motion.div
                  {...revealOnMount(0.5)}
                  className="mt-6 flex items-baseline justify-between border-t border-border pt-4"
                >
                  <span className="font-mono text-xs uppercase tracking-[0.15em] text-muted-foreground">
                    Left this month
                  </span>
                  <span className="font-mono text-xl font-bold font-tabular text-affordable">
                    {formatCurrency(remaining, "USD")}
                  </span>
                </motion.div>
              </div>

              <div className="mt-8 text-center">
                <Button size="lg" className="w-full" asChild>
                  <Link href="/login">Get started</Link>
                </Button>
              </div>
            </div>
            <TornEdge flip />
          </motion.div>

          {/* Feature line items — more of the same receipt */}
          <motion.div {...revealOnScroll()} className="mt-14 divide-y divide-border">
            {FEATURES.map(({ icon: Icon, label, description }) => (
              <div key={label} className="flex gap-4 py-5 first:pt-0 last:pb-0">
                <Icon className="mt-0.5 size-5 shrink-0 text-primary" strokeWidth={1.75} />
                <div>
                  <h2 className="font-heading text-base tracking-tight">{label}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{description}</p>
                </div>
              </div>
            ))}
          </motion.div>

          {/* Sign-off */}
          <div className="mt-14">
            <span className="perforation block" />
          </div>
          <motion.div {...revealOnScroll()} className="mt-8 text-center">
            <p className="font-heading text-xl tracking-tight">That&apos;s the whole list.</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Yours takes about a minute to start.
            </p>
            <Button size="lg" className="mt-5" asChild>
              <Link href="/login">Get started — it&apos;s free</Link>
            </Button>
          </motion.div>

          {/* Footer */}
          <div className="mt-14 flex flex-col items-center gap-3 pb-8">
            <div
              aria-hidden
              className="h-6 w-32 opacity-40"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(90deg, var(--foreground) 0 2px, transparent 2px 5px)",
              }}
            />
            <p className="font-mono text-[11px] text-muted-foreground">
              Wishpri — track what you want against what you actually have.
            </p>
            <Link
              href="/privacy"
              className="font-mono text-[11px] text-muted-foreground underline underline-offset-2 hover:text-foreground"
            >
              Privacy Policy
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
