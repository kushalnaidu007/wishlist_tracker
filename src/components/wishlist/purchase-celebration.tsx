"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, useReducedMotion } from "motion/react";
import { tornEdgeClipPath } from "@/lib/torn-edge";

// Small torn scraps of "receipt paper" rather than round confetti — same
// material as the marketing page's receipt card, in the app's own palette
// instead of generic rainbow confetti.
const PIECE_COLORS = [
  "bg-primary",
  "bg-affordable",
  "bg-cat-indigo",
  "bg-cat-sage",
  "bg-cat-clay",
  "bg-cat-gold",
  "bg-cat-blue",
  "bg-cat-mauve",
];

const PIECE_CLIP_PATH = tornEdgeClipPath(3, 55);
const PIECE_COUNT = 28;
const CLEANUP_MS = 2400;

interface Piece {
  id: number;
  left: number;
  color: string;
  delay: number;
  duration: number;
  rotate: number;
  drift: number;
  width: number;
  height: number;
}

function makePieces(): Piece[] {
  return Array.from({ length: PIECE_COUNT }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    color: PIECE_COLORS[i % PIECE_COLORS.length],
    delay: Math.random() * 0.3,
    duration: 1.4 + Math.random() * 0.9,
    rotate: (Math.random() - 0.5) * 500,
    drift: (Math.random() - 0.5) * 140,
    width: 8 + Math.random() * 6,
    height: 14 + Math.random() * 10,
  }));
}

export function PurchaseCelebration({
  active,
  onComplete,
}: {
  active: boolean;
  onComplete: () => void;
}) {
  const reduceMotion = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  const [pieces, setPieces] = useState<Piece[]>([]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- gates portal rendering until client mount, same pattern as theme-toggle.tsx
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!active) return;
    if (reduceMotion) {
      onComplete();
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- responding to the `active` trigger flipping, not synchronizing render state
    setPieces(makePieces());
    const timeout = setTimeout(onComplete, CLEANUP_MS);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- onComplete is a fresh closure each render; only re-run when `active` flips
  }, [active, reduceMotion]);

  if (!mounted || !active || reduceMotion) return null;

  return createPortal(
    <div aria-hidden className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {pieces.map((p) => (
        <motion.span
          key={p.id}
          className={`absolute top-[-40px] ${p.color}`}
          style={{
            left: `${p.left}%`,
            width: p.width,
            height: p.height,
            clipPath: PIECE_CLIP_PATH,
          }}
          initial={{ y: 0, x: 0, rotate: 0, opacity: 1 }}
          animate={{
            y: "110vh",
            x: p.drift,
            rotate: p.rotate,
            opacity: [1, 1, 0.9, 0],
          }}
          transition={{ duration: p.duration, delay: p.delay, ease: "easeIn" }}
        />
      ))}
    </div>,
    document.body
  );
}
