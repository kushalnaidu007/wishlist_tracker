"use client";

import { useTransition } from "react";
import { LogOut } from "lucide-react";
import { toast } from "sonner";
import {
  leaveGroup,
  removeMember,
  transferOwnership,
} from "@/app/group/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/profile/user-avatar";

interface Member {
  id: string;
  userId: string;
  role: string;
  displayName: string;
}

export function MemberList({
  members,
  currentUserId,
  isOwner,
  groupId,
}: {
  members: Member[];
  currentUserId: string;
  isOwner: boolean;
  groupId: string;
}) {
  const [isPending, startTransition] = useTransition();

  function handleRemove(memberId: string) {
    startTransition(async () => {
      const result = await removeMember(memberId);
      if (result?.error) toast.error(result.error);
    });
  }

  function handleTransfer(memberId: string) {
    startTransition(async () => {
      const result = await transferOwnership(memberId);
      if (result?.error) toast.error(result.error);
    });
  }

  function handleLeave() {
    startTransition(() => {
      leaveGroup(groupId);
    });
  }

  return (
    <div className="rounded-md border border-border bg-card p-5">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
        Members
      </p>
      <div className="mt-3 space-y-3">
        {members.map((member) => {
          const isSelf = member.userId === currentUserId;
          return (
            <div key={member.id} className="flex items-center gap-3">
              <UserAvatar label={member.displayName} className="size-9 text-sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {member.displayName}
                  {isSelf && <span className="text-muted-foreground"> (you)</span>}
                </p>
              </div>
              {member.role === "owner" && <Badge variant="secondary">Owner</Badge>}
              {isOwner && !isSelf && (
                <div className="flex shrink-0 items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={isPending}
                    onClick={() => handleTransfer(member.id)}
                  >
                    Make owner
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={isPending}
                    onClick={() => handleRemove(member.id)}
                  >
                    Remove
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="mt-4 border-t border-border pt-3">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={isPending}
          onClick={handleLeave}
        >
          <LogOut className="size-4" />
          Leave group
        </Button>
      </div>
    </div>
  );
}
