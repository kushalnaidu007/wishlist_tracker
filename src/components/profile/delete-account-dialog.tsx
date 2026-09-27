"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteAccount } from "@/app/profile/actions";
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

export function DeleteAccountDialog() {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await deleteAccount(formData);
      // No success branch — deleteAccount redirects on success, which
      // navigates away before this ever resolves with a value.
      if (result?.error) {
        setError(result.error);
      }
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          setPassword("");
          setError(null);
        }
      }}
    >
      <DialogTrigger asChild>
        <Button variant="destructive">
          <Trash2 className="size-4" />
          Delete account
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-heading">Delete your account</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          This permanently deletes your account, your personal wishlist and
          balance history, and any feedback you&apos;ve submitted. If you own a
          group with other members, ownership passes to the longest-tenured
          member; if you&apos;re its last member, the group is deleted too.
          This can&apos;t be undone.
        </p>
        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="delete-password">Confirm your password</Label>
            <Input
              id="delete-password"
              name="password"
              type="password"
              required
              autoFocus
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button
              type="submit"
              variant="destructive"
              disabled={isPending || !password}
              className="w-full"
            >
              {isPending ? "Deleting…" : "Permanently delete my account"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
