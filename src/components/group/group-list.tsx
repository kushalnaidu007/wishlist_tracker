import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface GroupSummary {
  id: string;
  name: string;
  role: string;
}

export function GroupList({ groups }: { groups: GroupSummary[] }) {
  return (
    <div className="rounded-md border border-border bg-card p-5">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
        Your groups
      </p>
      <div className="mt-3 space-y-1">
        {groups.map((group) => (
          <Link
            key={group.id}
            href={`/group/${group.id}`}
            className="flex items-center gap-3 rounded-md px-2 py-2 -mx-2 transition-colors hover:bg-secondary"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{group.name}</p>
            </div>
            {group.role === "owner" && <Badge variant="secondary">Owner</Badge>}
            <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
          </Link>
        ))}
      </div>
    </div>
  );
}
