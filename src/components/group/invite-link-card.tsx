"use client";

import { useState, useTransition } from "react";
import { Check, Copy, Link2 } from "lucide-react";
import { toast } from "sonner";
import { createInvite } from "@/app/group/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function InviteLinkCard({ groupId }: { groupId: string }) {
  const [isPending, startTransition] = useTransition();
  const [link, setLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleGenerate() {
    setError(null);
    startTransition(async () => {
      const result = await createInvite(groupId);
      if (result.error || !result.id) {
        setError(result.error ?? "Couldn't create an invite.");
        return;
      }
      setLink(`${window.location.origin}/invite/${result.id}`);
      setCopied(false);
    });
  }

  async function handleCopy() {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      toast.success("Invite link copied");
    } catch {
      toast.error("Couldn't copy — select and copy the link manually");
    }
  }

  return (
    <div className="rounded-md border border-border bg-card p-5">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
        Invite
      </p>
      <p className="mt-1 text-sm text-muted-foreground">
        Anyone with this link can join — it expires in 7 days.
      </p>

      {link ? (
        <div className="mt-3 flex items-center gap-2">
          <Input readOnly value={link} className="font-mono text-sm" />
          <Button type="button" size="icon" variant="outline" onClick={handleCopy} aria-label="Copy invite link">
            {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
          </Button>
        </div>
      ) : (
        <Button type="button" className="mt-3" disabled={isPending} onClick={handleGenerate}>
          <Link2 className="size-4" />
          {isPending ? "Generating…" : "Generate invite link"}
        </Button>
      )}
      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
    </div>
  );
}
