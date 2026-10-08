// Writes the local Supabase URL and keys into .env.local.
// Run after `npm run db:start`. Keeps every other line already in .env.local.
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";

const isWindows = process.platform === "win32";
let status;
try {
  const raw = execFileSync(isWindows ? "npx.cmd" : "npx", ["supabase", "status", "-o", "json"], {
    encoding: "utf8",
    shell: isWindows,
    stdio: ["ignore", "pipe", "pipe"],
  });
  status = JSON.parse(raw.slice(raw.indexOf("{")));
} catch {
  console.error("Local Supabase isn't running. Start Docker Desktop, then run: npm run db:start");
  process.exit(1);
}

const values = {
  NEXT_PUBLIC_SUPABASE_URL: status.API_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: status.ANON_KEY ?? status.PUBLISHABLE_KEY,
  SUPABASE_SERVICE_ROLE_KEY: status.SERVICE_ROLE_KEY ?? status.SECRET_KEY,
};

const missing = Object.entries(values).filter(([, v]) => !v).map(([k]) => k);
if (missing.length) {
  console.error(`supabase status did not return: ${missing.join(", ")}. Is it running? (npm run db:start)`);
  process.exit(1);
}

const path = ".env.local";
const lines = existsSync(path) ? readFileSync(path, "utf8").split(/\r?\n/) : [];
for (const [key, value] of Object.entries(values)) {
  const i = lines.findIndex((l) => l.startsWith(`${key}=`));
  if (i === -1) lines.push(`${key}=${value}`);
  else lines[i] = `${key}=${value}`;
}
writeFileSync(path, lines.filter((l, i) => l || i < lines.length - 1).join("\n") + "\n");

console.log(`.env.local updated with local Supabase at ${values.NEXT_PUBLIC_SUPABASE_URL}`);
const inbox = status.INBUCKET_URL ?? status.MAILPIT_URL;
if (inbox) console.log(`Magic-link emails: ${inbox}`);
