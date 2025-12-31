import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://fivmliegmqukdshfduld.supabase.co';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZpdm1saWVnbXF1a2RzaGZkdWxkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYwNDgwMzksImV4cCI6MjA4MTYyNDAzOX0.qYq45QDRfC2iiQC8XNxPTjr3bsE47LmGQN4QmcOTZdg';

  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}
