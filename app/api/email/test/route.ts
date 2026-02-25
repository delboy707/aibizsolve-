import { NextRequest, NextResponse } from 'next/server';
import { sendDocumentReadyEmail } from '@/lib/email/client';
import { createClient } from '@/lib/supabase/server';

// Development-only endpoint to verify email configuration.
// Usage: POST /api/email/test  (no body required — sends to authenticated user's email)
//
// Steps to test locally:
// 1. Set RESEND_API_KEY in .env.local
// 2. Sign in to the app
// 3. curl -X POST http://localhost:3000/api/email/test \
//      -H "Cookie: <your-session-cookie>"
// 4. Check your inbox (or Resend dashboard logs)
export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
  }

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const toEmail = body.email || user.email;

  try {
    await sendDocumentReadyEmail(toEmail, {
      userName: toEmail.split('@')[0],
      problemTitle: 'How do we grow revenue 30% without hiring?',
      documentUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/document/test-preview`,
      executiveSummary:
        'Your business faces a classic growth constraint: scaling revenue without proportional headcount increase. ' +
        'The analysis identifies three high-leverage paths — productisation of services, pricing architecture, ' +
        'and channel expansion — each with distinct risk/effort profiles.',
    });

    return NextResponse.json({ success: true, sentTo: toEmail });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
