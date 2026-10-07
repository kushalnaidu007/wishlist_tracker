"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { RECOVERY_COOKIE } from "@/app/auth/callback/route";
import { createClient } from "@/lib/supabase/server";
import { siteUrl } from "@/lib/supabase/env";

export interface AuthFormState {
  status: "idle" | "sent" | "error";
  message?: string;
}

export async function signIn(
  _prevState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/");

  if (!email || !password) {
    return { status: "error", message: "Enter your email and password." };
  }

  const supabase = await createClient();
  if (!supabase) {
    return { status: "error", message: "Supabase isn't configured yet." };
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return { status: "error", message: error.message };
  }

  redirect(next);
}

export async function signUp(
  _prevState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/");

  if (!email || !password) {
    return { status: "error", message: "Enter your email and password." };
  }
  if (password.length < 6) {
    return { status: "error", message: "Password must be at least 6 characters." };
  }

  const supabase = await createClient();
  if (!supabase) {
    return { status: "error", message: "Supabase isn't configured yet." };
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${siteUrl}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });

  if (error) {
    return { status: "error", message: error.message };
  }

  if (data.session) {
    redirect(next);
  }

  return {
    status: "sent",
    message: `Check ${email} to confirm your account, then sign in.`,
  };
}

export async function requestPasswordReset(
  _prevState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "").trim();

  if (!email) {
    return { status: "error", message: "Enter your email." };
  }

  const supabase = await createClient();
  if (!supabase) {
    return { status: "error", message: "Supabase isn't configured yet." };
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl}/auth/callback?next=${encodeURIComponent("/reset-password")}`,
  });

  // Supabase doesn't error for an unregistered email — it already handles
  // that silently, by design, for the same anti-enumeration reason as the
  // generic message below. A real error here means something actually
  // went wrong (rate limit, network, config) — safe to surface honestly
  // without reintroducing that leak, since it's unrelated to whether the
  // email exists.
  if (error) {
    return {
      status: "error",
      message: "Something went wrong sending the reset link. Try again in a few minutes.",
    };
  }

  return {
    status: "sent",
    message: "If an account exists for that email, we've sent a password reset link.",
  };
}

export async function resetPassword(
  _prevState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const password = String(formData.get("password") ?? "");

  if (password.length < 6) {
    return { status: "error", message: "Password must be at least 6 characters." };
  }

  // A session alone isn't enough — must specifically have just come
  // through the recovery-link exchange (see /auth/callback), not any
  // other signed-in session (e.g. a hijacked cookie from elsewhere in
  // the app). This is the same check the page itself makes; repeated
  // here since this action is the actual mutation point.
  const cookieStore = await cookies();
  if (!cookieStore.get(RECOVERY_COOKIE)) {
    return {
      status: "error",
      message: "This reset link has expired or was already used. Request a new one.",
    };
  }

  const supabase = await createClient();
  if (!supabase) {
    return { status: "error", message: "Supabase isn't configured yet." };
  }

  // Only works because the recovery link's callback already established a
  // valid session for this user — no current password needed, that's the
  // whole point of this flow.
  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    return { status: "error", message: error.message };
  }

  // Single-use — consume it so the same recovery session can't set
  // another password later.
  cookieStore.delete(RECOVERY_COOKIE);
  redirect("/");
}
