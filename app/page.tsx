import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-white">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <header className="border-b border-gray-200 bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">Q</span>
            </div>
            <span className="font-semibold text-gray-900 text-lg">QEP AISolve</span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/auth"
              className="text-gray-600 hover:text-gray-900 font-medium text-sm transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/auth?mode=signup"
              className="bg-primary-600 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-primary-700 transition-colors"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      </header>

      <main>

        {/* ── Hero ────────────────────────────────────────────────────────────── */}
        <section className="bg-gray-50 py-24 sm:py-32">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <p className="text-sm font-semibold text-primary-600 uppercase tracking-widest mb-5">
              Strategic Intelligence Platform
            </p>
            <h1 className="text-4xl sm:text-6xl font-bold text-gray-900 leading-tight mb-6">
              The Strategic Thinking Partner<br className="hidden sm:block" />
              for Leaders Who Don&apos;t Have<br className="hidden sm:block" />
              Time to Think
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-10">
              Get structured strategic options in minutes — including the unconventional
              moves your competitors won&apos;t consider.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/auth?mode=signup"
                className="px-8 py-4 bg-primary-600 text-white rounded-xl text-lg font-semibold hover:bg-primary-700 transition-colors shadow-sm w-full sm:w-auto"
              >
                Get Your Free Strategic Report
              </Link>
              <Link
                href="/pricing"
                className="text-primary-600 font-semibold hover:text-primary-700 transition-colors"
              >
                See pricing →
              </Link>
            </div>
            <p className="text-sm text-gray-500 mt-5">
              No credit card required. One free report, no strings attached.
            </p>
          </div>
        </section>

        {/* ── Social proof ────────────────────────────────────────────────────── */}
        <section className="border-y border-gray-200 bg-white py-10">
          <div className="max-w-3xl mx-auto px-6 text-center">
            <p className="text-gray-600 text-base">
              Built by a consultant with{' '}
              <strong className="text-gray-900">30+ years of experience</strong> across{' '}
              <strong className="text-gray-900">80+ countries</strong>.{' '}
              <strong className="text-gray-900">583 strategic frameworks</strong> from the
              world&apos;s best business thinking — applied invisibly to your problem.
            </p>
          </div>
        </section>

        {/* ── How It Works ────────────────────────────────────────────────────── */}
        <section className="py-24 bg-white">
          <div className="max-w-5xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                How It Works
              </h2>
              <p className="text-lg text-gray-600">
                From messy business question to board-ready plan in three steps.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  step: '01',
                  icon: '💬',
                  title: 'Describe your challenge',
                  body: 'Tell us the strategic question keeping you up at night. Plain English, no templates.',
                },
                {
                  step: '02',
                  icon: '📄',
                  title: 'Get structured analysis',
                  body: 'Receive a consultancy-grade SCQA document with 3 strategic options and a 90-day roadmap.',
                },
                {
                  step: '03',
                  icon: '🎯',
                  title: 'See the curveball',
                  body: 'Behavioural Alchemy reveals the counterintuitive move your competitors won\'t consider.',
                },
              ].map(({ step, icon, title, body }) => (
                <div key={step} className="relative bg-gray-50 rounded-2xl p-8">
                  <span className="text-5xl font-bold text-gray-100 absolute top-6 right-6 select-none">
                    {step}
                  </span>
                  <div className="text-3xl mb-4">{icon}</div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Dual Lens: Strategy + Surprise ──────────────────────────────────── */}
        <section className="py-24 bg-gray-50">
          <div className="max-w-5xl mx-auto px-6">
            <div className="text-center mb-14">
              <p className="text-sm font-semibold text-primary-600 uppercase tracking-widest mb-3">
                The Differentiator
              </p>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                Strategy + Surprise
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Every report shows you what the business textbooks recommend — and then what a
                behavioural strategist might suggest instead. Because the obvious move isn&apos;t
                always the right move.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* The Playbook */}
              <div className="bg-white rounded-2xl border border-gray-200 p-8">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center text-xl">
                    📊
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">The Playbook</h3>
                </div>
                <p className="text-gray-600 text-sm mb-6 leading-relaxed">
                  Conventional strategic analysis using proven frameworks: situation diagnosis,
                  three strategic options with pros/cons, a 90-day implementation roadmap,
                  and risk mitigation planning.
                </p>
                <ul className="space-y-2 text-sm text-gray-700">
                  {[
                    'SCQA executive summary',
                    'Three strategic options compared',
                    '90-day implementation roadmap',
                    'Risk register with mitigations',
                  ].map((f) => (
                    <li key={f} className="flex items-center gap-2">
                      <span className="text-primary-500">✓</span> {f}
                    </li>
                  ))}
                </ul>
              </div>

              {/* The Curveball */}
              <div className="bg-amber-50 rounded-2xl border border-amber-200 p-8">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center text-xl">
                    🎯
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">The Curveball</h3>
                    <span className="text-xs font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                      Behavioural Alchemy
                    </span>
                  </div>
                </div>
                <p className="text-amber-900 text-sm mb-6 leading-relaxed">
                  Counterintuitive options drawn from behavioural strategy: the move that
                  feels wrong but works, the perception shift that changes everything,
                  the $5K intervention with outsized impact.
                </p>
                <ul className="space-y-2 text-sm text-amber-800">
                  {[
                    'The Opposite Lens — reverse the obvious',
                    'The Perception Play — change how it feels',
                    'Small Bet, Big Signal — micro-intervention',
                    'The Hidden Driver — the real problem',
                  ].map((f) => (
                    <li key={f} className="flex items-center gap-2">
                      <span className="text-amber-500">⚗️</span> {f}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* ── Domains ─────────────────────────────────────────────────────────── */}
        <section className="py-24 bg-white">
          <div className="max-w-5xl mx-auto px-6">
            <div className="text-center mb-14">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Seven Business Domains
              </h2>
              <p className="text-gray-600">
                Start with Strategy, Marketing, and Sales. More coming for Founding Leaders.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { name: 'Strategy', icon: '♟️', available: true },
                { name: 'Marketing', icon: '📣', available: true },
                { name: 'Sales', icon: '🤝', available: true },
                { name: 'Innovation', icon: '💡', available: false },
                { name: 'Operations', icon: '⚙️', available: false },
                { name: 'HR', icon: '👥', available: false },
                { name: 'Finance', icon: '📈', available: false },
              ].map(({ name, icon, available }) => (
                <div
                  key={name}
                  className={`rounded-xl border p-5 text-center ${
                    available
                      ? 'border-primary-200 bg-primary-50'
                      : 'border-gray-200 bg-gray-50 opacity-60'
                  }`}
                >
                  <div className="text-2xl mb-2">{icon}</div>
                  <p className={`text-sm font-semibold ${available ? 'text-primary-900' : 'text-gray-500'}`}>
                    {name}
                  </p>
                  <p className={`text-xs mt-1 ${available ? 'text-primary-600' : 'text-gray-400'}`}>
                    {available ? 'Available now' : 'Founding Leader'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Bottom CTA ──────────────────────────────────────────────────────── */}
        <section className="py-24 bg-primary-600">
          <div className="max-w-3xl mx-auto px-6 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              What&apos;s the single biggest strategic question keeping you up at night?
            </h2>
            <p className="text-primary-200 text-lg mb-10">
              Consultancy-depth thinking at SaaS speed. Your first report is free.
            </p>
            <Link
              href="/auth?mode=signup"
              className="inline-block px-10 py-4 bg-white text-primary-700 rounded-xl text-lg font-bold hover:bg-gray-50 transition-colors shadow"
            >
              Get Your Free Report →
            </Link>
            <p className="text-primary-300 text-sm mt-5">
              No credit card. No 28-day trial clock. Just one free report on your real problem.
            </p>
          </div>
        </section>

      </main>

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <footer className="border-t border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 bg-primary-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xs">Q</span>
                </div>
                <span className="font-semibold text-gray-900">QEP AISolve</span>
              </div>
              <p className="text-sm text-gray-600">
                Strategic Intelligence Platform for leaders who move fast.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-3 text-sm">Product</h4>
              <ul className="space-y-2">
                {[
                  { label: 'How It Works', href: '/#how-it-works' },
                  { label: 'Pricing', href: '/pricing' },
                  { label: 'Sign In', href: '/auth' },
                  { label: 'Get Started', href: '/auth?mode=signup' },
                ].map(({ label, href }) => (
                  <li key={label}>
                    <Link href={href} className="text-gray-600 hover:text-gray-900 text-sm transition-colors">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-3 text-sm">Support</h4>
              <a
                href="mailto:support@qep-aisolve.com"
                className="text-gray-600 hover:text-gray-900 text-sm transition-colors"
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
