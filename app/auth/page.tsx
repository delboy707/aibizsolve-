'use client';

import { useState, Suspense } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Turnstile } from '@marsidev/react-turnstile';

function AuthForm() {
  const searchParams = useSearchParams();
  const mode = searchParams.get('mode');
  const redirect = searchParams.get('redirect');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(mode === 'signup');
  const [isResetPassword, setIsResetPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      if (isResetPassword) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth?mode=reset-callback`,
        });
        if (error) throw error;
        setMessage('Check your email for the password reset link.');
        return;
      }

      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { captchaToken: captchaToken ?? undefined },
        });

        if (error) throw error;

        if (data.user) {
          // User profile is automatically created by database trigger
          setMessage('Check your email for the confirmation link.');
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
          options: { captchaToken: captchaToken ?? undefined },
        });

        if (error) throw error;

        if (data.user) {
          router.push(redirect || '/dashboard');
        }
      }
    } catch (error: any) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const getTitle = () => {
    if (isResetPassword) return 'Reset your password';
    if (isSignUp) return 'Create your account';
    return 'Welcome back';
  };

  const getSubtitle = () => {
    if (isResetPassword) return "Enter your email and we'll send a reset link.";
    if (isSignUp) return '28 days free. No credit card required.';
    return 'Sign in to continue';
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-bold text-navy-primary focus:outline-none focus:underline">
            QEP AISolve
          </Link>
          <h1 className="text-2xl font-bold text-navy-dark mt-6">
            {getTitle()}
          </h1>
          <p className="text-slate-600 mt-2">
            {getSubtitle()}
          </p>
        </div>

        <div className="bg-white p-8 rounded-lg border border-slate-200">
          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-navy-primary"
              />
            </div>

            {!isResetPassword && (
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-navy-primary"
                />
              </div>
            )}

            {message && (
              <div className={`p-3 rounded-md text-sm ${
                message.includes('Check your email')
                  ? 'bg-success/10 text-success'
                  : 'bg-error/10 text-error'
              }`}>
                {message}
              </div>
            )}

            <Turnstile
              siteKey="0x4AAAAAACoVezFPfRqG9AiG"
              onSuccess={(token) => setCaptchaToken(token)}
              onExpire={() => setCaptchaToken(null)}
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-navy-primary text-white py-2 rounded-md hover:bg-navy-light focus:outline-none focus:ring-2 focus:ring-navy-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading
                ? 'Loading...'
                : isResetPassword
                ? 'Send Reset Link'
                : isSignUp
                ? 'Sign Up'
                : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 text-center space-y-2">
            {!isResetPassword && !isSignUp && (
              <button
                onClick={() => { setIsResetPassword(true); setMessage(''); }}
                className="text-slate-500 hover:text-navy-primary focus:outline-none focus:underline text-sm block w-full"
              >
                Forgot your password?
              </button>
            )}

            {isResetPassword ? (
              <button
                onClick={() => { setIsResetPassword(false); setMessage(''); }}
                className="text-navy-primary hover:text-navy-light focus:outline-none focus:underline text-sm"
              >
                Back to sign in
              </button>
            ) : (
              <button
                onClick={() => { setIsSignUp(!isSignUp); setMessage(''); }}
                className="text-navy-primary hover:text-navy-light focus:outline-none focus:underline text-sm"
              >
                {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center text-slate-600">Loading...</div>
      </div>
    }>
      <AuthForm />
    </Suspense>
  );
}
