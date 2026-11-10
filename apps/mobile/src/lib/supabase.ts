import { createNutriTrackClient, type NutriTrackClient } from "@nutritrack/api-client";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppState } from "react-native";

// EXPO_PUBLIC_* values are inlined into the app bundle, so only public values may be used here:
// the URL and the publishable key. Never the service-role key.
const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!url || !publishableKey) {
  throw new Error(
    "Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY. Copy apps/mobile/.env.example to apps/mobile/.env.",
  );
}

/** The app's single Supabase client. The session is kept on the device in AsyncStorage. */
export const supabase: NutriTrackClient = createNutriTrackClient(url, publishableKey, {
  auth: {
    storage: AsyncStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});

// Refresh the session only while the app is in the foreground.
AppState.addEventListener("change", (state) => {
  if (state === "active") void supabase.auth.startAutoRefresh();
  else void supabase.auth.stopAutoRefresh();
});
