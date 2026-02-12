
    
     import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const results: Record<string, unknown> = {
    url_length: url?.length ?? 'MISSING',
    anon_key_length: anonKey?.length ?? 'MISSING',
    service_key_length: serviceKey?.length ?? 'MISSING',
  };

  // Test with anon key directly
  try {
    const res = await fetch(`${url}/rest/v1/workflows?select=id&limit=1`, {
      headers: {
        'apikey': anonKey!,
        'Authorization': `Bearer ${anonKey}`,
      },
    });
    results.anon_test = {
      status: res.status,
      body: (await res.text()).substring(0, 200),
    };
  } catch (e) {
    results.anon_test = { error: String(e) };
  }

  return NextResponse.json(results);
}
