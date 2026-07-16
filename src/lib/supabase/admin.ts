import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Service-role Supabase client — bypasses Row-Level Security entirely.
 *
 * Reserved for a small, explicit set of trusted server-only operations:
 * the Documenso webhook handler updating contracts.signing_status, and the
 * invite-before-signup flow inserting an org_memberships row before the
 * invitee has an account. Never call this on a path that a client request's
 * input can influence which rows get touched — use lib/supabase/server.ts
 * (RLS-checked) for anything reachable from user input.
 */
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
