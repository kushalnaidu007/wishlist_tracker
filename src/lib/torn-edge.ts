/**
 * A torn-paper zigzag edge as a CSS clip-path polygon — used anywhere the
 * app wants to look like real receipt paper (the marketing page's receipt
 * card, purchase-celebration confetti). Flat top, zigzag bottom; rotate
 * 180° to flip which side looks torn.
 */
export function tornEdgeClipPath(teeth: number, peakDepth: number): string {
  const points = ["0% 0%"];
  for (let i = 0; i <= teeth; i++) {
    const x = (i / teeth) * 100;
    points.push(`${x}% ${i % 2 === 0 ? "100%" : `${peakDepth}%`}`);
  }
  points.push("100% 0%");
  return `polygon(${points.join(", ")})`;
}
