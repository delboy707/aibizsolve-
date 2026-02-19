import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export function createClient() {
  const url = 'https://fivmliegmqukdshfduld.supabase.co';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!key) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY');
  }

  return createSupabaseClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
