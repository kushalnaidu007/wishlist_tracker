"use client";

import { useActionState } from "react";
import { motion } from "motion/react";
import Link from "next/link";
import { signIn, signUp, type AuthFormState } from "@/app/login/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const initialState: AuthFormState = { status: "idle" };

export function LoginForm({ next }: { next: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="w-full max-w-sm"
    >
      <div className="mb-8 text-center">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
          Group wishlist
        </p>
        <h1 className="mt-2 font-sans text-4xl font-bold tracking-tight text-foreground">
          Wishpri
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Track what you want against what you actually have.
        </p>
      </div>

      <div className="rounded-md border border-border bg-card p-6 shadow-sm">
        <Tabs defaultValue="signin">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="signin">Sign in</TabsTrigger>
            <TabsTrigger value="signup">Create account</TabsTrigger>
          </TabsList>
          <TabsContent value="signin" className="mt-4">
            <SignInForm next={next} />
          </TabsContent>
          <TabsContent value="signup" className="mt-4">
            <SignUpForm next={next} />
          </TabsContent>
        </Tabs>
      </div>
    </motion.div>
  );
}

function SignInForm({ next }: { next: string }) {
  const [state, formAction, isPending] = useActionState(signIn, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="next" value={next} />
      <div className="space-y-1.5">
        <Label htmlFor="signin-email" className="font-mono text-xs uppercase tracking-wide text-muted-foreground">
          Email
        </Label>
        <Input
          id="signin-email"
          name="email"
          type="email"
          required
          autoFocus
          placeholder="you@example.com"
          className="font-mono"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="signin-password" className="font-mono text-xs uppercase tracking-wide text-muted-foreground">
          Password
        </Label>
        <Input
          id="signin-password"
          name="password"
          type="password"
          required
          className="font-mono"
        />
      </div>
      {state.status === "error" && (
        <p className="text-sm text-destructive">{state.message}</p>
      )}
      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}

function SignUpForm({ next }: { next: string }) {
  const [state, formAction, isPending] = useActionState(signUp, initialState);

  if (state.status === "sent") {
    return <p className="text-sm text-foreground">{state.message}</p>;
  }

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="next" value={next} />
      <div className="space-y-1.5">
        <Label htmlFor="signup-email" className="font-mono text-xs uppercase tracking-wide text-muted-foreground">
          Email
        </Label>
        <Input
          id="signup-email"
          name="email"
          type="email"
          required
          placeholder="you@example.com"
          className="font-mono"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="signup-password" className="font-mono text-xs uppercase tracking-wide text-muted-foreground">
          Password
        </Label>
        <Input
          id="signup-password"
          name="password"
          type="password"
          required
          minLength={6}
          className="font-mono"
        />
        <p className="text-xs text-muted-foreground">At least 6 characters.</p>
      </div>
      {state.status === "error" && (
        <p className="text-sm text-destructive">{state.message}</p>
      )}
      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Creating account…" : "Create account"}
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        By creating an account, you agree to our{" "}
        <Link href="/privacy" className="underline underline-offset-2 hover:text-foreground">
          Privacy Policy
        </Link>
        .
      </p>
    </form>
  );
}
