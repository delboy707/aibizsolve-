// Replace the contents of: app/api/workflows/status/route.ts
// with this temporary diagnostic version

import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const diagnostics: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    env_check: {
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? `${process.env.NEXT_PUBLIC_SUPABASE_URL.substring(0, 30)}...` : 'MISSING',
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? `${process.env.SUPABASE_SERVICE_ROLE_KEY.substring(0, 20)}...(length: ${process.env.SUPABASE_SERVICE_ROLE_KEY.length})` : 'MISSING',
      OPENAI_API_KEY: process.env.OPENAI_API_KEY ? 'SET' : 'MISSING',
      ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY ? 'SET' : 'MISSING',
    },
  };

  try {
    // Step 1: Try creating the admin client
    const { createClient } = await import('@/lib/supabase/admin');
    const supabase = createClient();
    diagnostics.admin_client = 'Created OK';

    // Step 2: Try a simple query
    const { count, error, status, statusText } = await supabase
      .from('workflows')
      .select('*', { count: 'exact', head: true });

    diagnostics.query_result = {
      count,
      error: error ? {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        // Include the full error object
        full: JSON.parse(JSON.stringify(error)),
      } : null,
      status,
      statusText,
    };

    // Step 3: If query failed, try a raw fetch to see what Supabase returns
    if (error) {
      try {
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
        const rawResponse = await fetch(`${url}/rest/v1/workflows?select=count&limit=1`, {
          headers: {
            'apikey': key!,
            'Authorization': `Bearer ${key}`,
            'Content-Type': 'application/json',
            'Prefer': 'count=exact',
          },
        });
        const rawBody = await rawResponse.text();
        diagnostics.raw_fetch = {
          status: rawResponse.status,
          statusText: rawResponse.statusText,
          body: rawBody.substring(0, 500),
          headers: Object.fromEntries(rawResponse.headers.entries()),
        };
      } catch (fetchErr) {
        diagnostics.raw_fetch = {
          error: String(fetchErr),
        };
      }
    }

    // Step 4: Try listing tables to confirm connection works
    const { data: tableCheck, error: tableError } = await supabase
      .from('users')
      .select('id', { count: 'exact', head: true });

    diagnostics.users_table_check = {
      accessible: !tableError,
      error: tableError ? tableError.message : null,
    };

    return NextResponse.json(diagnostics, { status: error ? 500 : 200 });

  } catch (outerError) {
    diagnostics.outer_error = {
      message: outerError instanceof Error ? outerError.message : String(outerError),
      stack: outerError instanceof Error ? outerError.stack?.split('\n').slice(0, 3) : undefined,
    };
    return NextResponse.json(diagnostics, { status: 500 });
  }
}
