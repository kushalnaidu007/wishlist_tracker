import { CATEGORY_TINT_CLASSES, getItemVisual } from "@/lib/item-icon";
import { cn } from "@/lib/utils";

export function ItemIconBadge({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  const { icon: Icon, tint } = getItemVisual(name);

  return (
    <span
      className={cn(
        "flex size-10 shrink-0 items-center justify-center rounded-lg",
        CATEGORY_TINT_CLASSES[tint],
        className
      )}
    >
      <Icon className="size-[18px]" strokeWidth={2} />
    </span>
  );
}
