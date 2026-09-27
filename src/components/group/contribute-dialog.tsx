"use client";

import { useState, useTransition } from "react";
import { HandCoins } from "lucide-react";
import { toast } from "sonner";
import { addContribution } from "@/app/group/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ContributeDialog({
  itemId,
  itemName,
  currency,
}: {
  itemId: string;
  itemName: string;
  currency: string;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await addContribution(itemId, formData);
      if (result?.error) {
        setError(result.error);
        return;
      }
      toast.success("Contribution added");
      setOpen(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="ghost" size="sm" onClick={(e) => e.stopPropagation()}>
          <HandCoins className="size-4" />
          Contribute
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xs">
        <DialogHeader>
          <DialogTitle className="font-heading">Contribute to {itemName}</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="amount">Amount ({currency})</Label>
            <Input
              id="amount"
              name="amount"
              type="number"
              inputMode="decimal"
              min={0.01}
              step={0.01}
              required
              autoFocus
              placeholder="0.00"
              className="font-mono"
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="submit" disabled={isPending} className="w-full">
              {isPending ? "Adding…" : "Add contribution"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
