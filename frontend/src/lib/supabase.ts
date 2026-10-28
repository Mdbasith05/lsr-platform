import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://tintsoyiruagowfkzldw.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  !supabaseUrl.includes("your-project-id") &&
  supabaseAnonKey !== "your-anon-key-placeholder"
);

// Fallback dummy client if anon key has not yet been placed in .env.local
export const supabase: SupabaseClient = createClient(
  supabaseUrl,
  supabaseAnonKey || "dummy-anon-key-for-initialization",
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);

/**
 * Returns the active Supabase access token for sending in Authorization Bearer headers.
 * Safe to call from client-side API requests.
 */
export async function getSupabaseAccessToken(): Promise<string | null> {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error || !session) {
      return null;
    }
    return session.access_token;
  } catch {
    return null;
  }
}
