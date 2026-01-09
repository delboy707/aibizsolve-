import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ExampleLibrary } from '@/components/examples/ExampleLibrary';
import { DecisionsList } from '@/components/dashboard/DecisionsList';

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
              <p className="text-sm text-primary-50">Type your business challenge. After you send your first message, you can also upload supporting documents (PDF, DOCX, TXT, CSV)</p>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-3xl">2️⃣</span>
                <h3 className="font-semibold">Answer Questions</h3>
              </div>
              <p className="text-sm text-primary-50">Our AI will ask 2-4 clarifying questions to understand your context, goals, and constraints</p>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-3xl">3️⃣</span>
                <h3 className="font-semibold">Generate Strategic Document</h3>
              </div>
              <p className="text-sm text-primary-50">Click "Generate Strategic Document" button after answering questions. Takes ~2 minutes to create your custom analysis</p>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-3xl">4️⃣</span>
                <h3 className="font-semibold">Review & Download</h3>
              </div>
              <p className="text-sm text-primary-50">Get a comprehensive strategic plan with 30-60-90 day roadmap, risk mitigation, and Alchemy insights (counterintuitive options for average+ subscribers). Download as needed</p>
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
            <DecisionsList decisions={decisions} />
          ) : (
            <div className="space-y-8">
              {/* Empty State Message */}
              <div className="bg-white p-12 rounded-xl border border-gray-200 text-center">
                <p className="text-gray-600 mb-4">No decisions yet</p>
                <Link
                  href="/chat"
                  className="inline-block bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors font-medium"
                >
                  Create Your First Decision
                </Link>
              </div>

              {/* Example Library */}
              <ExampleLibrary ctaHref="/chat" ctaText="Start Your Strategic Analysis" />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
