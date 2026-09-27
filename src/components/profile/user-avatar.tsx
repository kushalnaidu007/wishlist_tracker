import { cn } from "@/lib/utils";

export function UserAvatar({
  label,
  className,
}: {
  label?: string | null;
  className?: string;
}) {
  const initial = (label?.trim()?.[0] ?? "?").toUpperCase();

  return (
    <span
      className={cn(
        "flex size-14 shrink-0 items-center justify-center rounded-full bg-primary font-heading text-2xl text-primary-foreground",
        className
      )}
    >
      {initial}
    </span>
  );
}
