'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

const PROGRESS_STAGES = [
  'Analysing your challenge...',
  'Matching strategic frameworks...',
  'Generating conventional analysis...',
  'Applying Behavioural Alchemy lens...',
];

export default function OnboardingPage() {
  const [step, setStep] = useState<'question' | 'processing' | 'error'>('question');
  const [problem, setProblem] = useState('');
  const [currentStage, setCurrentStage] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const router = useRouter();
  const supabase = createClient();

  const handleSubmit = async () => {
    if (!problem.trim()) return;

    setStep('processing');
    setCurrentStage(0);

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth');
        return;
      }

      // Create decision
      const { data: decision, error: decisionError } = await supabase
        .from('decisions')
        .insert({
          user_id: user.id,
          problem_statement: problem.trim(),
          status: 'intake',
        })
        .select()
        .single();

      if (decisionError || !decision) {
        throw new Error('Failed to create decision');
      }

      // Save the initial message
      await supabase.from('messages').insert({
        decision_id: decision.id,
        role: 'user',
        content: problem.trim(),
      });

      // Progress through stages while generating
      const stageInterval = setInterval(() => {
        setCurrentStage((prev) => Math.min(prev + 1, PROGRESS_STAGES.length - 1));
      }, 4000);

      // Generate document directly (skip clarifying questions for onboarding)
      const response = await fetch('/api/document/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decisionId: decision.id }),
      });

      clearInterval(stageInterval);

      if (!response.ok) {
        const data = await response.json();
        if (data.code === 'REPORT_LIMIT_REACHED') {
          router.push('/upgrade?reason=report_limit');
          return;
        }
        throw new Error(data.error || 'Failed to generate document');
      }

      // Redirect to the document view
      router.push(`/document/${decision.id}`);
    } catch (err) {
      setStep('error');
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    }
  };

  if (step === 'processing') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center px-6">
          <div className="mb-8">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-primary-600 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Generating Your Strategic Report</h2>
          </div>

          <div className="space-y-4 text-left">
            {PROGRESS_STAGES.map((stage, i) => (
              <div
                key={i}
                className={`flex items-center gap-3 transition-all duration-500 ${
                  i <= currentStage ? 'opacity-100' : 'opacity-30'
                }`}
              >
                {i < currentStage ? (
                  <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : i === currentStage ? (
                  <svg className="w-5 h-5 text-primary-600 animate-spin flex-shrink-0" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <div className="w-5 h-5 border-2 border-gray-300 rounded-full flex-shrink-0" />
                )}
                <span className={`text-sm ${i <= currentStage ? 'text-gray-900 font-medium' : 'text-gray-400'}`}>
                  {stage}
                </span>
              </div>
            ))}
          </div>

          <p className="text-xs text-gray-500 mt-8">
            This typically takes 1-2 minutes. Your report is being built using 583 strategic frameworks.
          </p>
        </div>
      </div>
    );
  }

  if (step === 'error') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center px-6">
          <div className="text-4xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Something went wrong</h2>
          <p className="text-gray-600 mb-6">{errorMsg}</p>
          <button
            onClick={() => { setStep('question'); setErrorMsg(''); }}
            className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-semibold"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Step 1: The Question
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Minimal header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">Q</span>
            </div>
            <span className="font-semibold text-gray-900 text-lg">QEP AISolve</span>
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4">
        <div className="max-w-2xl w-full mx-auto text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            What&apos;s the single biggest strategic question keeping you up at night?
          </h1>
          <p className="text-gray-600 mb-8">
            Describe your challenge in a few sentences. We&apos;ll generate a consultancy-grade strategic report with structured options and a 90-day roadmap.
          </p>

          <textarea
            value={problem}
            onChange={(e) => setProblem(e.target.value)}
            placeholder="e.g. We're a B2B SaaS company with $2M ARR. Growth has stalled at 15% YoY and we're losing deals to a cheaper competitor. Should we cut prices, differentiate harder, or pivot to a new market segment?"
            className="w-full h-40 p-4 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none text-base"
          />

          <button
            onClick={handleSubmit}
            disabled={!problem.trim()}
            className="mt-6 px-8 py-4 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            Generate My Strategic Report
          </button>

          <p className="text-xs text-gray-500 mt-4">
            Your first report is free. No credit card required.
          </p>
        </div>
      </main>
    </div>
  );
}
