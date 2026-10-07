"use client";

import { useState, useTransition } from "react";
import { KeyRound } from "lucide-react";
import { toast } from "sonner";
import { changePassword } from "@/app/profile/actions";
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

function emptyFields() {
  return { currentPassword: "", newPassword: "", confirmPassword: "" };
}

export function ChangePasswordDialog() {
  const [open, setOpen] = useState(false);
  const [fields, setFields] = useState(emptyFields);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const mismatch =
    fields.confirmPassword.length > 0 && fields.newPassword !== fields.confirmPassword;
  const canSubmit =
    fields.currentPassword && fields.newPassword && fields.confirmPassword && !mismatch;

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await changePassword(formData);
      if (result?.error) {
        setError(result.error);
        return;
      }
      toast.success("Password updated");
      setFields(emptyFields());
      setOpen(false);
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          setFields(emptyFields());
          setError(null);
        }
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline">
          <KeyRound className="size-4" />
          Change password
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-heading">Change your password</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="change-current-password">Current password</Label>
            <Input
              id="change-current-password"
              name="currentPassword"
              type="password"
              required
              autoFocus
              value={fields.currentPassword}
              onChange={(e) => setFields((f) => ({ ...f, currentPassword: e.target.value }))}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="change-new-password">New password</Label>
            <Input
              id="change-new-password"
              name="newPassword"
              type="password"
              required
              minLength={6}
              value={fields.newPassword}
              onChange={(e) => setFields((f) => ({ ...f, newPassword: e.target.value }))}
            />
            <p className="text-xs text-muted-foreground">At least 6 characters.</p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="change-confirm-password">Confirm new password</Label>
            <Input
              id="change-confirm-password"
              name="confirmPassword"
              type="password"
              required
              minLength={6}
              value={fields.confirmPassword}
              onChange={(e) => setFields((f) => ({ ...f, confirmPassword: e.target.value }))}
            />
            {mismatch && <p className="text-xs text-destructive">Passwords don&apos;t match.</p>}
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="submit" disabled={isPending || !canSubmit} className="w-full">
              {isPending ? "Saving…" : "Update password"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
