"use client";

import { useState, useTransition } from "react";
import { createGroup } from "@/app/group/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function CreateGroupForm() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await createGroup(formData);
      if (result?.error) {
        setError(result.error);
      }
    });
  }

  return (
    <div className="rounded-md border border-border bg-card p-5">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
        Start a group
      </p>
      <p className="mt-1 text-sm text-muted-foreground">
        Share a wishlist and pool balances with anyone — roommates, family,
        friends planning something together.
      </p>
      <form action={handleSubmit} className="mt-4 flex items-end gap-3">
        <div className="flex-1 space-y-1.5">
          <Label htmlFor="name">Group name</Label>
          <Input id="name" name="name" required maxLength={80} placeholder="The Smiths" />
        </div>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Creating…" : "Create"}
        </Button>
      </form>
      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
    </div>
  );
}
