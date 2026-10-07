import Link from "next/link";
import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { SetupNotice } from "@/components/setup-notice";
import { CurrencyForm } from "@/components/profile/currency-form";
import { DisplayNameForm } from "@/components/profile/display-name-form";
import { ChangePasswordDialog } from "@/components/profile/change-password-dialog";
import { FeedbackDialog } from "@/components/profile/feedback-dialog";
import { DeleteAccountDialog } from "@/components/profile/delete-account-dialog";
import { UserAvatar } from "@/components/profile/user-avatar";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { getProfiles } from "@/lib/data";
import { getUserCurrency } from "@/lib/currency";

export default async function ProfilePage() {
  if (!isSupabaseConfigured) {
    return <SetupNotice />;
  }

  const supabase = await createClient();
  if (!supabase) return <SetupNotice />;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const displayNames = await getProfiles(supabase, [user.id]);
  const displayName = displayNames.get(user.id) ?? user.email ?? "";

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-3xl space-y-6 px-4 py-8 sm:px-6">
        <div className="flex items-center gap-4 rounded-md border border-border bg-card p-5">
          <UserAvatar label={displayName} />
          <div className="min-w-0">
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
              Account
            </p>
            <h1 className="mt-1 font-heading text-2xl tracking-tight">Welcome back</h1>
            <p className="mt-0.5 truncate text-sm text-muted-foreground">
              {user.email}
            </p>
          </div>
        </div>
        <DisplayNameForm currentDisplayName={displayName} />
        <CurrencyForm currentCurrency={getUserCurrency(user)} />
        <div className="flex items-center justify-between rounded-md border border-border bg-card p-5">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Password
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Change your password — you&apos;ll need your current one.
            </p>
          </div>
          <ChangePasswordDialog />
        </div>
        <div className="flex items-center justify-between rounded-md border border-border bg-card p-5">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Feedback
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Tell us what&apos;s working or what isn&apos;t — takes a minute.
            </p>
          </div>
          <FeedbackDialog />
        </div>
        <div className="flex items-center justify-between rounded-md border border-destructive/30 bg-card p-5">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-destructive">
              Danger zone
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Permanently delete your account and everything in it.
            </p>
          </div>
          <DeleteAccountDialog />
        </div>
        <p className="text-center">
          <Link
            href="/privacy"
            className="font-mono text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
          >
            Privacy Policy
          </Link>
        </p>
      </main>
    </div>
  );
}
