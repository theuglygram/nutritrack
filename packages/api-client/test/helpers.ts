/** Shared setup for integration tests against the local Supabase stack. */
import { createNutriTrackClient, type NutriTrackClient } from "../src/index.ts";

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_PUBLISHABLE_KEY;
const mailpit = process.env.MAILPIT_URL;
export const configured = Boolean(url && key && mailpit);

export function newClient(): NutriTrackClient {
  if (!url || !key) throw new Error("SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY are required");
  return createNutriTrackClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Polls Mailpit for the newest email to `email` whose subject contains `subject`; returns its 6-digit code. */
export async function latestCode(email: string, subject: string): Promise<string> {
  // Up to 20 s: Mailpit can be slow on shared CI runners.
  for (let attempt = 0; attempt < 80; attempt++) {
    const res = await fetch(
      `${mailpit}/api/v1/search?query=${encodeURIComponent(`to:"${email}"`)}`,
    );
    const body = (await res.json()) as { messages: { ID: string; Subject: string }[] };
    const match = body.messages.find((m) => m.Subject.includes(subject));
    if (match) {
      const msg = (await (await fetch(`${mailpit}/api/v1/message/${match.ID}`)).json()) as {
        Text: string;
        HTML: string;
      };
      const code = /\b(\d{6})\b/.exec(msg.Text || msg.HTML)?.[1];
      if (code) return code;
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error(`No "${subject}" email with a code arrived for ${email}`);
}

/** Signs up a fresh user, confirms the email with the emailed code and returns the signed-in client. */
export async function confirmedUser(prefix: string): Promise<NutriTrackClient> {
  const { signUp, verifySignUpCode } = await import("../src/index.ts");
  const client = newClient();
  const email = `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
  await signUp(client, { email, password: "jollof2026" });
  await verifySignUpCode(client, { email, code: await latestCode(email, "confirmation code") });
  return client;
}
