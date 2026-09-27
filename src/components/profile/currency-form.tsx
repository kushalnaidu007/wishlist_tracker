"use client";

import { useState, useTransition } from "react";
import { setCurrency } from "@/app/actions";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CURRENCIES } from "@/lib/currency";

export function CurrencyForm({ currentCurrency }: { currentCurrency: string }) {
  const [currency, setCurrencyValue] = useState(currentCurrency);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await setCurrency(formData);
      if (result?.error) {
        setError(result.error);
      }
    });
  }

  return (
    <form action={handleSubmit} className="rounded-md border border-border bg-card p-5">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
        Currency
      </p>
      <p className="mt-1 text-sm text-muted-foreground">
        Applies to every amount across the wishlist and balance.
      </p>

      <div className="mt-4">
        <Select name="currency" value={currency} onValueChange={setCurrencyValue}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CURRENCIES.map((c) => (
              <SelectItem key={c.code} value={c.code}>
                {c.code} — {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}

      <div className="mt-4 flex justify-end">
        <Button type="submit" disabled={isPending || currency === currentCurrency}>
          {isPending ? "Saving…" : "Save"}
        </Button>
      </div>
    </form>
  );
}
