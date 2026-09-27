"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { setDisplayName } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function DisplayNameForm({ currentDisplayName }: { currentDisplayName: string }) {
  const [displayName, setDisplayNameValue] = useState(currentDisplayName);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await setDisplayName(formData);
      if (result?.error) {
        setError(result.error);
        return;
      }
      toast.success("Display name updated");
    });
  }

  return (
    <form action={handleSubmit} className="rounded-md border border-border bg-card p-5">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
        Display name
      </p>
      <p className="mt-1 text-sm text-muted-foreground">
        Shown to anyone you share a group with, instead of your email.
      </p>

      <div className="mt-4">
        <Input
          name="displayName"
          required
          maxLength={40}
          value={displayName}
          onChange={(e) => setDisplayNameValue(e.target.value)}
        />
      </div>

      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}

      <div className="mt-4 flex justify-end">
        <Button
          type="submit"
          disabled={isPending || displayName.trim() === currentDisplayName || !displayName.trim()}
        >
          {isPending ? "Saving…" : "Save"}
        </Button>
      </div>
    </form>
  );
}
