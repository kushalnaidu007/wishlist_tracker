import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { RECOVERY_COOKIE } from "@/app/auth/callback/route";
import { ResetPasswordForm } from "@/components/reset-password-form";
import { SetupNotice } from "@/components/setup-notice";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export default async function ResetPasswordPage() {
  if (!isSupabaseConfigured) {
    return <SetupNotice />;
  }

  const supabase = await createClient();
  if (!supabase) return <SetupNotice />;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // A session alone isn't enough — must specifically have just come
  // through the recovery-link exchange, not any other signed-in session.
  const cookieStore = await cookies();
  if (!cookieStore.get(RECOVERY_COOKIE)) redirect("/forgot-password");

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <ResetPasswordForm />
    </div>
  );
}
