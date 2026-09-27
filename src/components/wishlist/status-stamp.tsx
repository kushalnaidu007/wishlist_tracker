import { cn } from "@/lib/utils";

export function StatusStamp({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex -rotate-6 items-center rounded-sm border-2 border-affordable px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-widest text-affordable",
        className
      )}
    >
      Purchased
    </span>
  );
}
