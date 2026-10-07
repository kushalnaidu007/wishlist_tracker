import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Set only when this exchange was for the password-recovery flow
 * specifically, never for an ordinary sign-in/signup confirmation.
 * /reset-password requires this cookie, not just a session — a session
 * alone (e.g. a hijacked cookie from anywhere else in the app) must not
 * be enough to set a new password without knowing the old one.
 */
export const RECOVERY_COOKIE = "pw_recovery";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();
    if (supabase) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        const response = NextResponse.redirect(`${origin}${next}`);
        if (next === "/reset-password") {
          response.cookies.set(RECOVERY_COOKIE, "1", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60 * 10,
          });
        }
        return response;
      }
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
