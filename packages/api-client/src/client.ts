import type { Database } from "@nutritrack/types";
import {
  createClient,
  type SupabaseClient,
  type SupabaseClientOptions,
} from "@supabase/supabase-js";

/** A Supabase client typed with the NutriTrack schema. Both apps create one and pass it in. */
export type NutriTrackClient = SupabaseClient<Database>;

/**
 * Create a typed client with plain supabase-js. Mobile uses this with AsyncStorage; the web app
 * uses @supabase/ssr's cookie-based clients instead (also typed with `Database`).
 * Only the publishable (anon) key may be used here — never the service-role key.
 */
export function createNutriTrackClient(
  url: string,
  publishableKey: string,
  options?: SupabaseClientOptions<"public">,
): NutriTrackClient {
  if (!url || !publishableKey) {
    throw new Error("Supabase URL and publishable key are required");
  }
  return createClient<Database>(url, publishableKey, options);
}
