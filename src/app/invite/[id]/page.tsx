import Link from "next/link";
import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { SetupNotice } from "@/components/setup-notice";
import { JoinGroupButton } from "@/components/group/join-group-button";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { getGroupMembership } from "@/lib/data";

export default async function InvitePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!isSupabaseConfigured) {
    return <SetupNotice />;
  }

  const supabase = await createClient();
  if (!supabase) return <SetupNotice />;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/invite/${(await params).id}`);

  const { id } = await params;

  const { data: invite } = await supabase
    .from("group_invites")
    .select("group_id, group_name, expires_at")
    .eq("id", id)
    .maybeSingle();

  const expired = invite ? new Date(invite.expires_at) < new Date() : false;

  const alreadyInThisGroup = invite
    ? await getGroupMembership(supabase, user.id, invite.group_id)
    : null;

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-sm px-4 py-16 sm:px-6">
        <div className="rounded-md border border-border bg-card p-6 text-center">
          {!invite || expired ? (
            <>
              <h1 className="font-heading text-xl tracking-tight">
                {expired ? "This invite has expired" : "Invite not found"}
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Ask whoever sent it to generate a new link.
              </p>
            </>
          ) : (
            <>
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
                You&apos;re invited to
              </p>
              <h1 className="mt-1 font-heading text-2xl tracking-tight">
                {invite.group_name}
              </h1>

              {alreadyInThisGroup ? (
                <p className="mt-4 text-sm text-muted-foreground">
                  You&apos;re already in this group.{" "}
                  <Link
                    href={`/group/${invite.group_id}`}
                    className="text-foreground underline underline-offset-2"
                  >
                    Go to it
                  </Link>
                  .
                </p>
              ) : (
                <div className="mt-4">
                  <JoinGroupButton inviteId={id} />
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
