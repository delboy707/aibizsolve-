import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// Admin client with service role key (bypasses RLS)
// Use this ONLY in server-side code and for administrative tasks
export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error('Missing Supabase admin credentials');
  }

  return createSupabaseClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
