import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const { searchParams, origin } = req.nextUrl;
  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type');
  const code = searchParams.get('code');

  const supabase = await createClient();

  // Handle PKCE code exchange (used by some Supabase auth flows)
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return NextResponse.redirect(
        `${origin}/auth?error=${encodeURIComponent('Invalid or expired link. Please try again.')}`
      );
    }

    if (type === 'recovery') {
      return NextResponse.redirect(`${origin}/auth?mode=reset-callback`);
    }

    return NextResponse.redirect(`${origin}/auth?message=${encodeURIComponent('Email confirmed. You can now sign in.')}`);
  }

  // Handle token_hash verification (email links with OTP tokens)
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash,
      type: type as 'recovery' | 'signup' | 'email',
    });

    if (error) {
      return NextResponse.redirect(
        `${origin}/auth?error=${encodeURIComponent('Invalid or expired link. Please try again.')}`
      );
    }

    if (type === 'recovery') {
      return NextResponse.redirect(`${origin}/auth?mode=reset-callback`);
    }

    // Email confirmation (signup or email change)
    return NextResponse.redirect(`${origin}/auth?message=${encodeURIComponent('Email confirmed. You can now sign in.')}`);
  }

  // No valid params — redirect to auth page with error
  return NextResponse.redirect(
    `${origin}/auth?error=${encodeURIComponent('Invalid authentication link.')}`
  );
}
