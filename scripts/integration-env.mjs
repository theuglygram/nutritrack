// Runs a command with the local Supabase URL, publishable key and Mailpit URL in its environment.
// Usage: node scripts/integration-env.mjs <command...>
// Only local-stack values are read (from `supabase status`); nothing secret is printed.
import { execSync, spawnSync } from "node:child_process";

const status = execSync("pnpm exec supabase status -o json", {
  encoding: "utf8",
  stdio: ["ignore", "pipe", "ignore"],
});
const json = JSON.parse(status.slice(status.indexOf("{")));

const env = {
  ...process.env,
  SUPABASE_URL: json.API_URL,
  SUPABASE_PUBLISHABLE_KEY: json.PUBLISHABLE_KEY,
  MAILPIT_URL: json.MAILPIT_URL,
};
for (const name of ["SUPABASE_URL", "SUPABASE_PUBLISHABLE_KEY", "MAILPIT_URL"]) {
  if (!env[name]) {
    console.error(`Local Supabase is not running or ${name} is missing. Run: pnpm db:start`);
    process.exit(1);
  }
}

// Arguments come from our own package.json scripts, not user input.
const command = process.argv.slice(2).join(" ");
const result = spawnSync(command, { env, stdio: "inherit", shell: true });
process.exit(result.status ?? 1);
