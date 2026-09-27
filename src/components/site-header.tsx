import Link from "next/link";
import { ChevronDown, Plus, User } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { SignOutButton } from "@/components/sign-out-button";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { getUserGroups } from "@/lib/data";

export async function SiteHeader() {
  // Every current call site already gates on config + auth before
  // rendering this, so a self-contained fetch here (rather than
  // prop-drilling groups through every page) is safe.
  const groups = isSupabaseConfigured ? await getGroupsForHeader() : [];

  return (
    <header className="border-b border-border bg-card">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="font-sans text-xl font-bold tracking-tight">
            Wishpri
          </span>
        </Link>
        <nav className="flex items-center gap-1">
          <Link
            href="/"
            className="rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            Wishlist
          </Link>
          {groups.length > 0 ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-1 rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
                  Groups
                  <ChevronDown className="size-3.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {groups.map((group) => (
                  <DropdownMenuItem key={group.id} asChild>
                    <Link href={`/group/${group.id}`}>{group.name}</Link>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/group">All groups</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/group">
                    <Plus className="size-4" />
                    New group
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link
              href="/group"
              className="rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              Groups
            </Link>
          )}
          <Button variant="ghost" size="icon" aria-label="Profile" asChild>
            <Link href="/profile">
              <User className="size-4" />
            </Link>
          </Button>
          <ThemeToggle />
          <SignOutButton />
        </nav>
      </div>
    </header>
  );
}

async function getGroupsForHeader() {
  const supabase = await createClient();
  if (!supabase) return [];

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  return getUserGroups(supabase, user.id);
}
