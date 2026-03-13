'use client';

import { useState, useEffect, Suspense } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

function AuthForm() {
  const searchParams = useSearchParams();
  const mode = searchParams.get('mode');
  const redirect = searchParams.get('redirect');
  const errorParam = searchParams.get('error');
  const messageParam = searchParams.get('message');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(mode === 'signup');
  const [isResetPassword, setIsResetPassword] = useState(false);
  const [isResetCallback, setIsResetCallback] = useState(mode === 'reset-callback');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(errorParam || messageParam || '');
  const router = useRouter();
  const supabase = createClient();

  // Handle implicit flow: Supabase may redirect with hash fragment
  // (#access_token=...&type=recovery) which the server route can't see.
  // This catches that case client-side.
  useEffect(() => {
    const hash = window.location.hash;
    if (!hash) return;

    const params = new URLSearchParams(hash.substring(1));
    const type = params.get('type');

    if (type === 'recovery') {
      // Supabase client auto-picks up the session from the hash fragment.
      // Just switch to the password reset form.
      window.history.replaceState(null, '', '/auth?mode=reset-callback');
      setIsResetCallback(true);
    }
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      if (isResetCallback) {
        if (password !== confirmPassword) {
          setMessage('Passwords do not match.');
          setLoading(false);
          return;
        }
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;
        setMessage('Password updated successfully. Redirecting to sign in...');
        setIsResetCallback(false);
        setTimeout(() => router.push('/auth'), 2000);
        return;
      }

      if (isResetPassword) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
        });
        if (error) throw error;
        setMessage('Check your email for the password reset link.');
        return;
      }

      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
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
    if (isResetCallback) return 'Set new password';
    if (isResetPassword) return 'Reset your password';
    if (isSignUp) return 'Create your account';
    return 'Welcome back';
  };

  const getSubtitle = () => {
    if (isResetCallback) return 'Enter your new password below.';
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
            {!isResetCallback && (
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
                  autoComplete="email"
                  className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-navy-primary"
                />
              </div>
            )}

            {!isResetPassword && (
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">
                  {isResetCallback ? 'New Password' : 'Password'}
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    autoComplete={isResetCallback ? 'new-password' : isSignUp ? 'new-password' : 'current-password'}
                    className="w-full px-3 py-2 pr-10 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-navy-primary"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            )}

            {isResetCallback && (
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 mb-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                    autoComplete="new-password"
                    className="w-full px-3 py-2 pr-10 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-navy-primary"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600"
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            )}

            {message && (
              <div className={`p-3 rounded-md text-sm ${
                message.includes('Check your email') || message.includes('successfully') || message.includes('confirmed')
                  ? 'bg-success/10 text-success'
                  : 'bg-error/10 text-error'
              }`}>
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-navy-primary text-white py-2 rounded-md hover:bg-navy-light focus:outline-none focus:ring-2 focus:ring-navy-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading
                ? 'Loading...'
                : isResetCallback
                ? 'Update Password'
                : isResetPassword
                ? 'Send Reset Link'
                : isSignUp
                ? 'Sign Up'
                : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 text-center space-y-2">
            {!isResetPassword && !isSignUp && !isResetCallback && (
              <button
                onClick={() => { setIsResetPassword(true); setMessage(''); }}
                className="text-slate-500 hover:text-navy-primary focus:outline-none focus:underline text-sm block w-full"
              >
                Forgot your password?
              </button>
            )}

            {isResetCallback ? (
              <button
                onClick={() => { setIsResetCallback(false); setMessage(''); router.push('/auth'); }}
                className="text-navy-primary hover:text-navy-light focus:outline-none focus:underline text-sm"
              >
                Back to sign in
              </button>
            ) : isResetPassword ? (
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
