// NEXT_PUBLIC_* values are inlined at build time, so each must be referenced literally.
// Only public values belong here: the URL and the publishable key. Never the service-role key.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!url || !publishableKey) {
  throw new Error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY. Copy apps/web/.env.example to apps/web/.env.local.",
  );
}

export const supabaseEnv = { url, publishableKey };
