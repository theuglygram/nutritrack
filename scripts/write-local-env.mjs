// Writes apps/web/.env.local and apps/mobile/.env from the running local Supabase stack.
// Usage: pnpm env:local   (after pnpm db:start)
// Only public values are written: the API URL and the publishable key.
import { execSync } from "node:child_process";
import { writeFileSync } from "node:fs";

const status = execSync("pnpm exec supabase status -o json", {
  encoding: "utf8",
  stdio: ["ignore", "pipe", "ignore"],
});
const { API_URL: url, PUBLISHABLE_KEY: key } = JSON.parse(status.slice(status.indexOf("{")));
if (!url || !key) {
  console.error("Local Supabase is not running. Run: pnpm db:start");
  process.exit(1);
}

writeFileSync(
  "apps/web/.env.local",
  `NEXT_PUBLIC_SUPABASE_URL=${url}\nNEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=${key}\n`,
);
writeFileSync(
  "apps/mobile/.env",
  `EXPO_PUBLIC_SUPABASE_URL=${url}\nEXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=${key}\n`,
);
console.log("Wrote apps/web/.env.local and apps/mobile/.env for the local Supabase stack.");
console.log(
  "On a physical phone, replace 127.0.0.1 in apps/mobile/.env with your computer's LAN IP.",
);
