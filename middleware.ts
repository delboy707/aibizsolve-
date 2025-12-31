import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );

  // Only run auth checks on protected routes
  const protectedRoutes = ['/dashboard', '/chat', '/document', '/pricing'];
  const isProtectedRoute = protectedRoutes.some(route =>
    request.nextUrl.pathname.startsWith(route)
  );

  if (!isProtectedRoute) {
    return response;
  }

  // Get user for protected routes only
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // If user is not logged in and trying to access protected routes
  if (!user && !request.nextUrl.pathname.startsWith('/auth')) {
    return NextResponse.redirect(new URL('/auth', request.url));
  }

  // If user is logged in, check trial expiration for non-paying users
  if (user) {
    try {
      const { data: userData } = await supabase
        .from('users')
        .select('payment_tier, trial_ends_at, monthly_payment')
        .eq('id', user.id)
        .single();

      // Check if trial has expired and user has no active payment
      const trialExpired =
        userData?.payment_tier === 'trial' &&
        new Date() > new Date(userData.trial_ends_at || 0);

      const hasActivePayment = userData?.monthly_payment && userData.monthly_payment > 0;

      // If trial expired and no payment, redirect to pricing
      if (trialExpired && !hasActivePayment && !request.nextUrl.pathname.startsWith('/pricing')) {
        return NextResponse.redirect(new URL('/pricing?expired=true', request.url));
      }
    } catch (error) {
      // If database query fails, allow access (don't break the app)
      console.error('Middleware database error:', error);
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
