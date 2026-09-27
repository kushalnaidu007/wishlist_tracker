"use client";

import { LogOut } from "lucide-react";
import { signOut } from "@/app/actions";
import { Button } from "@/components/ui/button";

export function SignOutButton() {
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Sign out"
      onClick={() => signOut()}
    >
      <LogOut className="size-4" />
    </Button>
  );
}
