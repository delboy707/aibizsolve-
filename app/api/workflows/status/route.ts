
    
     import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';

  return NextResponse.json({
    url_full: url,
    anon_key: {
      length: anonKey.length,
      first20: anonKey.substring(0, 20),
      last10: anonKey.substring(anonKey.length - 10),
    },
    service_key: {
      length: serviceKey.length,
      first20: serviceKey.substring(0, 20),
      last10: serviceKey.substring(serviceKey.length - 10),
    },
  });
}
