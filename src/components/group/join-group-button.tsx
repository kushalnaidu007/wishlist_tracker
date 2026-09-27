"use client";

import { useState, useTransition } from "react";
import { UserPlus } from "lucide-react";
import { joinGroup } from "@/app/group/actions";
import { Button } from "@/components/ui/button";

export function JoinGroupButton({ inviteId }: { inviteId: string }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleJoin() {
    setError(null);
    startTransition(async () => {
      const result = await joinGroup(inviteId);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <div>
      <Button type="button" disabled={isPending} onClick={handleJoin} className="w-full">
        <UserPlus className="size-4" />
        {isPending ? "Joining…" : "Join group"}
      </Button>
      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
    </div>
  );
}
