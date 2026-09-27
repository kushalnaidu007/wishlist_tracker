import { LoginForm } from "@/components/login-form";
import { SetupNotice } from "@/components/setup-notice";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  if (!isSupabaseConfigured) {
    return <SetupNotice />;
  }

  const { next } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <LoginForm next={next ?? "/"} />
    </div>
  );
}
