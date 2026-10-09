// Promotes an existing user to platform admin in the LOCAL Supabase.
// Usage: npm run db:admin -- you@example.com   (sign in once first, so the user exists)
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const email = process.argv[2]?.trim().toLowerCase();
if (!email) {
  console.error("Usage: npm run db:admin -- you@example.com");
  process.exit(1);
}

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split(/\r?\n/)
    .filter((l) => l.includes("=") && !l.startsWith("#"))
    .map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1)])
);

const url = env.NEXT_PUBLIC_SUPABASE_URL;
if (!/^https?:\/\/(127\.0\.0\.1|localhost)(:|\/|$)/.test(url ?? "")) {
  console.error(`Refusing to run: NEXT_PUBLIC_SUPABASE_URL is not local (${url}).`);
  process.exit(1);
}

const supabase = createClient(url, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { data, error } = await supabase.auth.admin.listUsers({ perPage: 1000 });
if (error) throw error;
const user = data.users.find((u) => u.email?.toLowerCase() === email);
if (!user) {
  console.error(`No local user with email ${email}. Sign in at /login once, then run this again.`);
  process.exit(1);
}

const { error: updateError } = await supabase
  .from("profiles")
  .update({ platform_role: "axel_admin" })
  .eq("id", user.id);
if (updateError) throw updateError;

console.log(`${email} is now an admin in the local database.`);
