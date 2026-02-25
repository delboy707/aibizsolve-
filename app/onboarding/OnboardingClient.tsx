'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

interface OnboardingClientProps {
  userId: string;
}

type Step = 'question' | 'processing' | 'error';

const PROCESSING_STAGES = [
  { label: 'Analysing your challenge...', duration: 3000 },
  { label: 'Matching strategic frameworks...', duration: 4000 },
  { label: 'Generating conventional analysis...', duration: 8000 },
  { label: 'Applying Behavioural Alchemy lens...', duration: 5000 },
];

export default function OnboardingClient({ userId }: OnboardingClientProps) {
  const router = useRouter();
  const supabase = createClient();

  const [step, setStep] = useState<Step>('question');
  const [question, setQuestion] = useState('');
  const [stageIndex, setStageIndex] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const stageTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-focus textarea on mount
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  // Advance processing stages on a timer
  useEffect(() => {
    if (step !== 'processing') return;

    let current = 0;
    setStageIndex(0);

    const advance = () => {
      current += 1;
      if (current < PROCESSING_STAGES.length) {
        setStageIndex(current);
        stageTimerRef.current = setTimeout(advance, PROCESSING_STAGES[current].duration);
      }
    };

    stageTimerRef.current = setTimeout(advance, PROCESSING_STAGES[0].duration);

    return () => {
      if (stageTimerRef.current) clearTimeout(stageTimerRef.current);
    };
  }, [step]);

  const handleSubmit = async () => {
    const trimmed = question.trim();
    if (!trimmed || trimmed.length < 10) return;

    setStep('processing');
    setErrorMsg('');

    try {
      // 1. Create a decision record
      const { data: decision, error: decisionError } = await supabase
        .from('decisions')
        .insert({
          user_id: userId,
          problem_statement: trimmed,
          status: 'intake',
        })
        .select()
        .single();

      if (decisionError || !decision) {
        throw new Error(decisionError?.message || 'Failed to create decision');
      }

      // 2. Save the initial user message
      await supabase.from('messages').insert({
        decision_id: decision.id,
        role: 'user',
        content: trimmed,
      });

      // 3. Generate the full SCQA document (+ Alchemy for free-tier: stored but teased)
      const res = await fetch('/api/document/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decisionId: decision.id }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Document generation failed');
      }

      // 4. Mark free report as used and set activation timestamps
      await supabase.from('users').update({
        free_report_used: true,
        first_report_at: new Date().toISOString(),
        activated_at: new Date().toISOString(),
      }).eq('id', userId);

      // 5. Redirect to document view
      router.push(`/document/${decision.id}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Something went wrong';
      setErrorMsg(msg);
      setStep('error');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Cmd/Ctrl + Enter submits
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      handleSubmit();
    }
  };

  // ── Step: error ──────────────────────────────────────────────────────────
  if (step === 'error') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
        <div className="max-w-md w-full text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-gray-900 mb-3">Something went wrong</h2>
          <p className="text-gray-600 text-sm mb-6">{errorMsg}</p>
          <button
            onClick={() => { setStep('question'); setErrorMsg(''); }}
            className="px-6 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  // ── Step: processing ─────────────────────────────────────────────────────
  if (step === 'processing') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
        <div className="max-w-md w-full text-center">
          {/* Spinner */}
          <div className="flex justify-center mb-8">
            <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Building your strategic report
          </h2>
          <p className="text-gray-500 text-sm mb-10">
            This takes about 20–30 seconds. We&apos;re applying 583 frameworks to your specific challenge.
          </p>

          {/* Stages */}
          <div className="space-y-3 text-left">
            {PROCESSING_STAGES.map((stage, i) => {
              const isDone = i < stageIndex;
              const isActive = i === stageIndex;
              return (
                <div
                  key={stage.label}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-500 ${
                    isActive
                      ? 'bg-primary-50 border border-primary-200'
                      : isDone
                      ? 'opacity-50'
                      : 'opacity-25'
                  }`}
                >
                  <div className="shrink-0 w-5 h-5">
                    {isDone ? (
                      <span className="text-primary-600 font-bold text-sm">✓</span>
                    ) : isActive ? (
                      <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
                    )}
                  </div>
                  <span
                    className={`text-sm font-medium ${
                      isActive ? 'text-primary-700' : isDone ? 'text-gray-500' : 'text-gray-400'
                    }`}
                  >
                    {stage.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ── Step: question ───────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-6">
      <div className="max-w-2xl w-full">

        {/* Brand */}
        <div className="text-center mb-12">
          <Link href="/" className="inline-flex items-center gap-2 mb-8">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">Q</span>
            </div>
            <span className="font-semibold text-gray-900 text-lg">QEP AISolve</span>
          </Link>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
            What&apos;s the single biggest strategic question keeping you up at night?
          </h1>
          <p className="text-gray-500 text-base">
            Be specific. The more concrete your challenge, the sharper the analysis.
          </p>
        </div>

        {/* Input */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <textarea
            ref={textareaRef}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="e.g. We've doubled our marketing spend over the last six months but revenue has barely moved. I'm not sure if it's the channel mix, the messaging, or a deeper positioning problem — and I need to decide where to focus for the next quarter."
            rows={6}
            className="w-full text-gray-900 placeholder-gray-400 text-base leading-relaxed resize-none focus:outline-none"
          />
          <div className="mt-4 flex items-center justify-between">
            <p className="text-xs text-gray-400">
              {question.trim().length > 0
                ? `${question.trim().length} characters`
                : 'Press ⌘ + Enter to submit'}
            </p>
            <button
              onClick={handleSubmit}
              disabled={question.trim().length < 10}
              className="px-6 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Generate My Strategic Report →
            </button>
          </div>
        </div>

        {/* Reassurance */}
        <p className="text-center text-xs text-gray-400 mt-6">
          Your first report is free. No credit card required.
          {' '}
          <Link href="/dashboard" className="underline hover:text-gray-600">
            Skip to dashboard
          </Link>
        </p>
      </div>
    </div>
  );
}
