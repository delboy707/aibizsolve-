import Link from "next/link";
import SiteHeader from "@/components/layout/SiteHeader";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <SiteHeader />

      {/* Hero Section */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6 leading-tight">
          The Strategic Thinking Partner for Leaders Who Don&apos;t Have Time to Think
        </h1>
        <p className="text-xl text-gray-600 mb-10 max-w-3xl mx-auto">
          Get structured strategic options in minutes — including the unconventional moves your competitors won&apos;t consider.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/auth?mode=signup"
            className="inline-block bg-primary-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-primary-700 transition-colors shadow-sm"
          >
            Get Your Free Strategic Report
          </Link>
          <Link href="/pricing" className="text-primary-600 hover:text-primary-700 font-semibold transition-colors">
            See pricing &rarr;
          </Link>
        </div>
      </section>

      {/* Social Proof / Credibility */}
      <section className="bg-white border-y border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          <p className="text-lg text-gray-700 italic">
            &ldquo;Built by a consultant with 30+ years of experience across 80+ countries. 583 strategic frameworks from the world&apos;s best business thinking.&rdquo;
          </p>
        </div>
      </section>

      {/* How It Works — Three Steps */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">
          How It Works
        </h2>
        <div className="grid md:grid-cols-3 gap-10">
          <div className="text-center">
            <div className="w-14 h-14 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">1</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Describe your challenge</h3>
            <p className="text-gray-600">
              Tell us the strategic question keeping you up at night.
            </p>
          </div>
          <div className="text-center">
            <div className="w-14 h-14 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">2</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Get structured analysis</h3>
            <p className="text-gray-600">
              Receive a consultancy-grade SCQA document with 3 strategic options and a 90-day roadmap.
            </p>
          </div>
          <div className="text-center">
            <div className="w-14 h-14 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">3</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">See the curveball</h3>
            <p className="text-gray-600">
              Behavioural Alchemy reveals the counterintuitive move your competitors won&apos;t consider.
            </p>
          </div>
        </div>
      </section>

      {/* The "Dual Lens" Feature Section */}
      <section className="bg-white border-y border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Strategy + Surprise</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Every report shows you what the business textbooks recommend — and then what a behavioural strategist might suggest instead. Because the obvious move isn&apos;t always the right move.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            {/* The Playbook */}
            <div className="bg-gray-50 rounded-xl border border-gray-200 p-8">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl">📊</span>
                <h3 className="text-xl font-semibold text-gray-900">The Playbook</h3>
              </div>
              <p className="text-gray-600 mb-4">Conventional strategic analysis built on proven frameworks:</p>
              <ul className="space-y-2 text-gray-700 text-sm">
                <li className="flex items-start gap-2"><span className="text-primary-600 mt-0.5">&#10003;</span>SCQA-structured executive summary</li>
                <li className="flex items-start gap-2"><span className="text-primary-600 mt-0.5">&#10003;</span>3 strategic options with pros, cons, and resources</li>
                <li className="flex items-start gap-2"><span className="text-primary-600 mt-0.5">&#10003;</span>30-60-90 day implementation roadmap</li>
                <li className="flex items-start gap-2"><span className="text-primary-600 mt-0.5">&#10003;</span>Risk mitigation with early warning signals</li>
              </ul>
            </div>
            {/* The Curveball */}
            <div className="bg-alchemy-bg rounded-xl border border-alchemy-border p-8">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl">🎯</span>
                <h3 className="text-xl font-semibold text-gray-900">The Curveball</h3>
              </div>
              <p className="text-gray-600 mb-4">Behavioural Alchemy — the counterintuitive options no one else suggests:</p>
              <ul className="space-y-2 text-gray-700 text-sm">
                <li className="flex items-start gap-2"><span className="text-amber-500 mt-0.5">&#10003;</span>What if the opposite approach works better?</li>
                <li className="flex items-start gap-2"><span className="text-amber-500 mt-0.5">&#10003;</span>What perception shift solves this without changing substance?</li>
                <li className="flex items-start gap-2"><span className="text-amber-500 mt-0.5">&#10003;</span>What signal would make this feel more valuable?</li>
                <li className="flex items-start gap-2"><span className="text-amber-500 mt-0.5">&#10003;</span>What micro-intervention under $10K has outsized impact?</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Domains Section */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <h2 className="text-3xl font-bold text-gray-900 mb-4 text-center">
          Seven Business Domains
        </h2>
        <p className="text-lg text-gray-600 mb-12 text-center max-w-2xl mx-auto">
          Strategic analysis across every function that matters.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {[
            { name: 'Strategy', available: true },
            { name: 'Marketing', available: true },
            { name: 'Sales', available: true },
            { name: 'Innovation', available: false },
            { name: 'Operations', available: false },
            { name: 'HR', available: false },
            { name: 'Finance', available: false },
          ].map((domain) => (
            <div
              key={domain.name}
              className={`rounded-xl border p-5 text-center ${
                domain.available
                  ? 'bg-white border-gray-200 shadow-sm'
                  : 'bg-gray-50 border-gray-100'
              }`}
            >
              <span className="text-lg font-semibold text-gray-900">{domain.name}</span>
              <p className={`text-xs mt-1 font-medium ${domain.available ? 'text-green-600' : 'text-gray-400'}`}>
                {domain.available ? 'Available' : 'Coming soon — Founding Leader'}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="bg-primary-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            What&apos;s the single biggest strategic question keeping you up at night?
          </h2>
          <p className="text-primary-100 text-lg mb-8">
            Your first report is free. No credit card required.
          </p>
          <Link
            href="/auth?mode=signup"
            className="inline-block bg-white text-primary-700 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-primary-50 transition-colors shadow-sm"
          >
            Get Your Free Report &rarr;
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 bg-primary-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xs">Q</span>
                </div>
                <span className="font-semibold text-gray-900">QEP AISolve</span>
              </div>
              <p className="text-sm text-gray-600 mb-2">
                Strategic Intelligence Platform for leaders who move fast.
              </p>
              <p className="text-sm text-gray-500">Built by QEP AI Labs</p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-3 text-sm">Navigation</h4>
              <ul className="space-y-2">
                <li><Link href="/" className="text-gray-600 hover:text-gray-900 text-sm font-medium transition-colors">Home</Link></li>
                <li><Link href="/pricing" className="text-gray-600 hover:text-gray-900 text-sm font-medium transition-colors">Pricing</Link></li>
                <li><Link href="/auth" className="text-gray-600 hover:text-gray-900 text-sm font-medium transition-colors">Sign In</Link></li>
                <li><Link href="/auth?mode=signup" className="text-gray-600 hover:text-gray-900 text-sm font-medium transition-colors">Get Started</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-3 text-sm">Support</h4>
              <a
                href="mailto:support@qep-aisolve.com"
                className="text-gray-600 hover:text-gray-900 text-sm font-medium transition-colors"
              >
                support@qep-aisolve.com
              </a>
            </div>
          </div>
          <div className="border-t border-gray-200 mt-8 pt-6 text-center">
            <p className="text-sm text-gray-500">
              &copy; {new Date().getFullYear()} QEP AISolve. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
