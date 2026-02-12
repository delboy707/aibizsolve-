import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  // Use placeholder values during build/SSG — the client won't be called server-side
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}
