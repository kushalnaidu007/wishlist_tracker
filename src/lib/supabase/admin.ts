import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";
import { supabaseUrl } from "./env";

const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

/**
 * Whether the service-role key is set. Distinct from `isSupabaseConfigured`
 * (the anon key) — the app can run fine without this; only account
 * deletion needs it.
 */
export const isAdminConfigured = Boolean(supabaseUrl && serviceRoleKey);

/**
 * Full-privilege client, bypassing RLS entirely — server-only, never
 * import this from a Client Component. The service-role key must never
 * reach the browser. Used for exactly one thing: deleting an auth user,
 * which the regular RLS-scoped client has no way to do at all.
 */
export function createAdminClient() {
  if (!isAdminConfigured) return null;

  return createSupabaseClient<Database>(supabaseUrl!, serviceRoleKey!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
