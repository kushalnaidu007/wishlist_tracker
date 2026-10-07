"use client";

import { useActionState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { requestPasswordReset } from "@/app/login/actions";
import type { AuthFormState } from "@/app/login/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: AuthFormState = { status: "idle" };

export function ForgotPasswordForm() {
  const [state, formAction, isPending] = useActionState(requestPasswordReset, initialState);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="w-full max-w-sm"
    >
      <div className="mb-8 text-center">
        <h1 className="font-sans text-2xl font-bold tracking-tight text-foreground">
          Reset your password
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Enter your email and we&apos;ll send you a link to set a new one.
        </p>
      </div>

      <div className="rounded-md border border-border bg-card p-6 shadow-sm">
        {state.status === "sent" ? (
          <p className="text-sm text-foreground">{state.message}</p>
        ) : (
          <form action={formAction} className="space-y-4">
            <div className="space-y-1.5">
              <Label
                htmlFor="forgot-email"
                className="font-mono text-xs uppercase tracking-wide text-muted-foreground"
              >
                Email
              </Label>
              <Input
                id="forgot-email"
                name="email"
                type="email"
                required
                autoFocus
                placeholder="you@example.com"
                className="font-mono"
              />
            </div>
            {state.status === "error" && (
              <p className="text-sm text-destructive">{state.message}</p>
            )}
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? "Sending…" : "Send reset link"}
            </Button>
          </form>
        )}
        <p className="mt-4 text-center text-xs text-muted-foreground">
          <Link href="/login" className="underline underline-offset-2 hover:text-foreground">
            Back to sign in
          </Link>
        </p>
      </div>
    </motion.div>
  );
}
