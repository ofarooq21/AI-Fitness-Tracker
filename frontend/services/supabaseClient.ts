import { createClient, SupabaseClient } from '@supabase/supabase-js';

// For Expo, use EXPO_PUBLIC_* env vars (available on web and native)
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

function createSafeClient(): SupabaseClient | any {
  if (SUPABASE_URL && SUPABASE_ANON_KEY) {
    return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
      },
    });
  }
  // Fallback shim so the app can still render without crashing
  console.warn('[Supabase] Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY. Auth disabled until configured.');
  return {
    auth: {
      async signUp() { return { data: { user: null }, error: new Error('Supabase not configured') }; },
      async signInWithPassword() { return { data: { user: null, session: null }, error: new Error('Supabase not configured') }; },
      async signOut() { return { error: null }; },
      async getUser() { return { data: { user: null } }; },
      async getSession() { return { data: { session: null } }; },
    },
  };
}

export const supabase = createSafeClient();


