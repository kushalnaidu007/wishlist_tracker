"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/app/actions";
import { getGroupMembers, getUserGroups } from "@/lib/data";
import { createAdminClient } from "@/lib/supabase/admin";

export async function deleteAccount(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  if (!password) {
    return { error: "Enter your password to confirm." };
  }

  const { supabase, user } = await requireUser();
  if (!user.email) {
    return { error: "Your account has no email on file — contact support to delete it." };
  }

  // Re-authenticate before doing anything destructive — same mechanism
  // signIn() already uses, not a new auth pattern.
  const { error: reauthError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password,
  });
  if (reauthError) {
    return { error: "Incorrect password." };
  }

  // Clean up group memberships first — same owner-promotion decision
  // leaveGroup() makes, but skipping its item-reassignment-to-personal
  // step, since those items are about to cascade-delete anyway once the
  // auth user itself is gone.
  const groups = await getUserGroups(supabase, user.id);

  for (const group of groups) {
    const members = await getGroupMembers(supabase, group.id);
    const others = members.filter((m) => m.user_id !== user.id);

    if (others.length > 0) {
      if (group.role === "owner") {
        // getGroupMembers orders by joined_at ascending — the first of
        // "others" is the longest-tenured remaining member.
        const nextOwner = others[0];
        const { error: promoteError } = await supabase
          .from("group_members")
          .update({ role: "owner" })
          .eq("id", nextOwner.id);
        if (promoteError) return { error: promoteError.message };
      }

      const { error: leaveError } = await supabase
        .from("group_members")
        .delete()
        .eq("id", group.membershipId);
      if (leaveError) return { error: leaveError.message };
    } else {
      // Last member out — delete the group outright. Existing cascades
      // clean up group_members, group_invites, and group_balance_entries.
      const { error: deleteError } = await supabase
        .from("groups")
        .delete()
        .eq("id", group.id);
      if (deleteError) return { error: deleteError.message };
    }
  }

  // The point of no return — everything above is still recoverable by
  // hand if something went wrong; this isn't.
  const admin = createAdminClient();
  if (!admin) {
    return { error: "Account deletion isn't configured on this server yet." };
  }

  const { error: deleteUserError } = await admin.auth.admin.deleteUser(user.id);
  if (deleteUserError) return { error: deleteUserError.message };

  await supabase.auth.signOut();
  redirect("/");
}

export async function changePassword(formData: FormData) {
  const currentPassword = String(formData.get("currentPassword") ?? "");
  const newPassword = String(formData.get("newPassword") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (!currentPassword) {
    return { error: "Enter your current password." };
  }
  if (newPassword.length < 6) {
    return { error: "New password must be at least 6 characters." };
  }
  if (newPassword !== confirmPassword) {
    return { error: "New passwords don't match." };
  }

  const { supabase, user } = await requireUser();
  if (!user.email) {
    return { error: "Your account has no email on file." };
  }

  // Same re-authentication shape as deleteAccount — verify the current
  // password before changing anything.
  const { error: reauthError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  });
  if (reauthError) {
    return { error: "Incorrect current password." };
  }

  const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
  if (updateError) return { error: updateError.message };

  return { error: null };
}
