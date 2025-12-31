import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">Q</span>
              </div>
              <span className="font-semibold text-gray-900 text-lg">QEP AISolve</span>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/auth" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">
                Sign In
              </Link>
              <Link
                href="/auth"
                className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors font-semibold shadow-sm"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
            Move your business fast without getting exposed
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            From messy business question to board-ready strategic plan — with the rationale, risks,
            and unconventional options already mapped out. In 20 minutes.
          </p>
          <p className="text-base text-gray-600 mb-12">
            Like having a top business consultant on speed dial — without the invoice.
          </p>

          <div className="space-y-4">
            <Link
              href="/auth"
              className="inline-block bg-primary-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-primary-700 transition-colors shadow-sm"
            >
              Start Free Trial
            </Link>
            <p className="text-sm text-gray-600">
              28 days free. Then pay what it's worth — $10 minimum, most pay $50-150/month.
            </p>
          </div>
        </div>

        {/* Features */}
        <div className="mt-24 grid md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              Top-Consultant Analysis
            </h3>
            <p className="text-gray-600">
              SCQA framework, 90-day roadmap, risk mitigation. All the structure, none of the jargon.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              Counterintuitive Options
            </h3>
            <p className="text-gray-600">
              Behavioral insights you won't find in standard playbooks. The Alchemy Layer differentiates us.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              Pay What You Want
            </h3>
            <p className="text-gray-600">
              We practice what we preach. Confident enough in unconventional thinking to price unconventionally.
            </p>
          </div>
        </div>

        {/* How It Works */}
        <div className="mt-24">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">
            How It Works
          </h2>
          <div className="space-y-6 max-w-2xl mx-auto">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center font-semibold">
                1
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Describe your problem</h4>
                <p className="text-gray-600">Tell us your business challenge in plain English</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center font-semibold">
                2
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Answer 2-4 clarifying questions</h4>
                <p className="text-gray-600">Mix of rational and behavioral questions to understand what's really happening</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center font-semibold">
                3
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Get your strategic document</h4>
                <p className="text-gray-600">Board-ready plan with rational strategy + counterintuitive options</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white mt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center text-gray-600">
          <p>&copy; 2025 QEP AISolve. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
