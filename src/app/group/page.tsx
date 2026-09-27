import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { SetupNotice } from "@/components/setup-notice";
import { PageLetterhead } from "@/components/page-letterhead";
import { CreateGroupForm } from "@/components/group/create-group-form";
import { GroupList } from "@/components/group/group-list";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { getUserGroups } from "@/lib/data";

export default async function GroupIndexPage() {
  if (!isSupabaseConfigured) {
    return <SetupNotice />;
  }

  const supabase = await createClient();
  if (!supabase) return <SetupNotice />;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const groups = await getUserGroups(supabase, user.id);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-3xl space-y-6 px-4 py-8 sm:px-6">
        <PageLetterhead eyebrow="Groups" title="Your groups" />
        {groups.length > 0 && <GroupList groups={groups} />}
        <CreateGroupForm />
      </main>
    </div>
  );
}
