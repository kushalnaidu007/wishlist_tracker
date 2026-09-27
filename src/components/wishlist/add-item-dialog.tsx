"use client";

import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { addItem } from "@/app/actions";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ItemIconBadge } from "@/components/wishlist/item-icon-badge";
import { PRIORITIES } from "@/lib/priority";

export function AddItemDialog({
  currency,
  groupId,
}: {
  currency: string;
  groupId?: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await addItem(formData);
      if (result?.error) {
        setError(result.error);
        return;
      }
      toast.success("Added to the wishlist");
      setName("");
      setOpen(false);
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setName("");
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="size-4" />
          Add item
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-heading">Add to the wishlist</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          {groupId && <input type="hidden" name="groupId" value={groupId} />}
          <div className="space-y-1.5">
            <Label htmlFor="name">Name</Label>
            <div className="flex items-center gap-2.5">
              <ItemIconBadge name={name} className="size-9" />
              <Input
                id="name"
                name="name"
                required
                maxLength={120}
                placeholder="Dishwasher"
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="cost">Cost ({currency})</Label>
              <Input
                id="cost"
                name="cost"
                type="number"
                inputMode="decimal"
                min={0}
                step={0.01}
                required
                placeholder="0.00"
                className="font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="priority">Priority</Label>
              <Select name="priority" defaultValue="3">
                <SelectTrigger id="priority" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="productUrl">Product link (optional)</Label>
            <Input
              id="productUrl"
              name="productUrl"
              type="url"
              placeholder="https://…"
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="submit" disabled={isPending} className="w-full">
              {isPending ? "Adding…" : "Add to wishlist"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
