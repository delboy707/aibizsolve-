import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import type { Decision } from '@/types';

export default async function DashboardPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth');
  }

  // Fetch user data
  const { data: userData } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();

  // Fetch user's decisions
  const { data: decisions } = await supabase
    .from('decisions')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  const handleSignOut = async () => {
    'use server';
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect('/');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">Q</span>
              </div>
              <span className="font-semibold text-gray-900 text-lg">QEP AISolve</span>
            </Link>

            {/* Nav Links */}
            <div className="flex items-center gap-6">
              <Link
                href="/pricing"
                className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
              >
                Pricing
              </Link>
              <div className="flex items-center gap-3 pl-6 border-l border-gray-200">
                <span className="text-sm text-gray-600">{user.email}</span>
                <form action={handleSignOut}>
                  <button
                    type="submit"
                    className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
                  >
                    Sign Out
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Banner - How It Works */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 p-8 rounded-xl mb-8 text-white shadow-sm">
          <h2 className="text-2xl font-bold mb-6">How QEP AISolve Works</h2>
          <div className="grid md:grid-cols-4 gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-3xl">1️⃣</span>
                <h3 className="font-semibold">Describe Your Problem</h3>
              </div>
              <p className="text-sm text-primary-50">Tell us your business challenge and/or upload documents</p>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-3xl">2️⃣</span>
                <h3 className="font-semibold">Answer Questions</h3>
              </div>
              <p className="text-sm text-primary-50">Our AI Database will ask you 2-4 clarifying questions to understand context</p>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-3xl">3️⃣</span>
                <h3 className="font-semibold">Generate Document</h3>
              </div>
              <p className="text-sm text-primary-50">Get a strategic plan (takes ~2 minutes)</p>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-3xl">4️⃣</span>
                <h3 className="font-semibold">Review Insights</h3>
              </div>
              <p className="text-sm text-primary-50">Strategic plan + counterintuitive options (Alchemy)</p>
            </div>
          </div>
        </div>

        {/* User Status */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 mb-8 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Your Account</h2>
              <p className="text-gray-700">
                Status: <span className="font-semibold capitalize text-primary-600">{userData?.payment_tier}</span>
              </p>
              {userData?.payment_tier === 'trial' && (
                <p className="text-sm text-gray-600 mt-1">
                  Trial ends: {new Date(userData.trial_ends_at).toLocaleDateString()}
                </p>
              )}
              {userData?.monthly_payment && userData.monthly_payment > 0 && (
                <p className="text-sm text-gray-600 mt-1">
                  Current payment: ${userData.monthly_payment}/month
                </p>
              )}
            </div>
            <Link
              href="/pricing"
              className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
            >
              Manage Subscription
            </Link>
          </div>
        </div>

        {/* New Decision Button with Instructions */}
        <div className="mb-8">
          <div className="flex items-center gap-4">
            <Link
              href="/chat"
              className="inline-flex items-center bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors font-semibold shadow-sm"
            >
              + New Decision
            </Link>
            <p className="text-sm text-gray-600">
              Start a new strategic consultation — ask about any business challenge
            </p>
          </div>
        </div>

        {/* Decisions List */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Decisions</h2>

          {decisions && decisions.length > 0 ? (
            <div className="grid gap-4">
              {decisions.map((decision: Decision) => (
                <div
                  key={decision.id}
                  className="bg-white p-6 rounded-xl border border-gray-200 hover:border-primary-500 hover:shadow-md transition-all"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {decision.problem_statement?.substring(0, 100) || 'Untitled Decision'}
                      {decision.problem_statement && decision.problem_statement.length > 100 && '...'}
                    </h3>
                    <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                      decision.status === 'complete'
                        ? 'bg-green-50 text-green-700 border border-green-200'
                        : decision.status === 'clarifying'
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'bg-gray-100 text-gray-600 border border-gray-200'
                    }`}>
                      {decision.status}
                    </span>
                  </div>

                  {decision.classified_domains && decision.classified_domains.length > 0 && (
                    <div className="flex gap-2 mb-3">
                      {decision.classified_domains.map((domain: string) => (
                        <span key={domain} className="text-xs bg-primary-50 text-primary-700 px-2 py-1 rounded border border-primary-200">
                          {domain}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-2 text-xs text-gray-500 mb-4">
                    <span>Created {new Date(decision.created_at).toLocaleDateString()}</span>
                    {decision.classified_intent && (
                      <span>• Intent: {decision.classified_intent}</span>
                    )}
                  </div>

                  {decision.status === 'complete' && (
                    <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-xs text-green-800">
                        ✓ <strong>Document ready!</strong> View your strategic plan + Alchemy insights
                      </p>
                    </div>
                  )}

                  {decision.status === 'clarifying' && (
                    <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-xs text-blue-800">
                        💬 <strong>In progress:</strong> Continue answering questions, then generate document (appears after 3+ messages)
                      </p>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <Link
                      href={`/chat/${decision.id}`}
                      className="flex-1 text-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
                    >
                      {decision.status === 'complete' ? 'Continue Chat' : 'Continue'}
                    </Link>
                    {decision.status === 'complete' && (
                      <Link
                        href={`/document/${decision.id}`}
                        className="flex-1 text-center px-4 py-2 border-2 border-primary-600 text-primary-600 rounded-lg hover:bg-primary-600 hover:text-white transition-colors text-sm font-medium"
                      >
                        📄 View Document
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white p-12 rounded-xl border border-gray-200 text-center">
              <p className="text-gray-600 mb-4">No decisions yet</p>
              <Link
                href="/chat"
                className="inline-block bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors font-medium"
              >
                Create Your First Decision
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
