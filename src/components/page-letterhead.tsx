export function PageLetterhead({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div>
      <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
        {eyebrow}
      </p>
      <h1 className="mt-1 font-heading text-2xl tracking-tight">{title}</h1>
    </div>
  );
}
