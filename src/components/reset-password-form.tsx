"use client";

import { useActionState, useState } from "react";
import { motion } from "motion/react";
import { resetPassword } from "@/app/login/actions";
import type { AuthFormState } from "@/app/login/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: AuthFormState = { status: "idle" };

export function ResetPasswordForm() {
  const [state, formAction, isPending] = useActionState(resetPassword, initialState);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const mismatch = confirm.length > 0 && password !== confirm;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="w-full max-w-sm"
    >
      <div className="mb-8 text-center">
        <h1 className="font-sans text-2xl font-bold tracking-tight text-foreground">
          Set a new password
        </h1>
      </div>

      <div className="rounded-md border border-border bg-card p-6 shadow-sm">
        <form action={formAction} className="space-y-4">
          <div className="space-y-1.5">
            <Label
              htmlFor="reset-password"
              className="font-mono text-xs uppercase tracking-wide text-muted-foreground"
            >
              New password
            </Label>
            <Input
              id="reset-password"
              name="password"
              type="password"
              required
              autoFocus
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="font-mono"
            />
            <p className="text-xs text-muted-foreground">At least 6 characters.</p>
          </div>
          <div className="space-y-1.5">
            <Label
              htmlFor="reset-password-confirm"
              className="font-mono text-xs uppercase tracking-wide text-muted-foreground"
            >
              Confirm new password
            </Label>
            <Input
              id="reset-password-confirm"
              type="password"
              required
              minLength={6}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="font-mono"
            />
            {mismatch && <p className="text-xs text-destructive">Passwords don&apos;t match.</p>}
          </div>
          {state.status === "error" && (
            <p className="text-sm text-destructive">{state.message}</p>
          )}
          <Button
            type="submit"
            className="w-full"
            disabled={isPending || mismatch || !password || !confirm}
          >
            {isPending ? "Saving…" : "Set new password"}
          </Button>
        </form>
      </div>
    </motion.div>
  );
}
