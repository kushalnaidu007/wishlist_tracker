"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

export function RatingInput({
  name,
  label,
  required,
}: {
  name: string;
  label: string;
  required?: boolean;
}) {
  const [value, setValue] = useState<number | null>(null);

  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium">{label}</label>
      <input type="hidden" name={name} value={value ?? ""} required={required} />
      <div className="flex gap-1.5">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setValue(n)}
            className={cn(
              "flex size-9 items-center justify-center rounded-md border text-sm font-medium transition-colors",
              value === n
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-muted-foreground hover:bg-secondary hover:text-foreground"
            )}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}
