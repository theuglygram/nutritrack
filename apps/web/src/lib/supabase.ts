"use client";

import type { NutriTrackClient } from "@nutritrack/api-client";
import type { Database } from "@nutritrack/types";
import { createBrowserClient } from "@supabase/ssr";
import { supabaseEnv } from "./env";

/**
 * Browser Supabase client. Sessions live in cookies so proxy.ts can refresh them and gate pages.
 * createBrowserClient returns a singleton in the browser.
 */
export function getSupabase(): NutriTrackClient {
  return createBrowserClient<Database>(supabaseEnv.url, supabaseEnv.publishableKey);
}
