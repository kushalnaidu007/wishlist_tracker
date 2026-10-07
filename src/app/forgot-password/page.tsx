import { ForgotPasswordForm } from "@/components/forgot-password-form";
import { SetupNotice } from "@/components/setup-notice";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export default function ForgotPasswordPage() {
  if (!isSupabaseConfigured) {
    return <SetupNotice />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <ForgotPasswordForm />
    </div>
  );
}
