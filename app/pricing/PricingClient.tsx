'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import PWYWSlider from '@/components/pricing/PWYWSlider';
import SegmentAnchors from '@/components/pricing/SegmentAnchors';
import BeatTheAverage from '@/components/pricing/BeatTheAverage';

interface PricingClientProps {
  user: any;
  userData: any;
  segments: Array<{
    segment: string;
    average_payment: number;
    median_payment: number;
  }>;
}

export default function PricingClient({ user, userData, segments }: PricingClientProps) {
  const searchParams = useSearchParams();
  const expired = searchParams.get('expired') === 'true';

  const [selectedAmount, setSelectedAmount] = useState(50);
  const [selectedSegment, setSelectedSegment] = useState<string>('solopreneur');
  const [isProcessing, setIsProcessing] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const currentSegment = segments.find(s => s.segment === selectedSegment);
  const averageAmount = currentSegment?.average_payment || 50;

  const isTrialActive = userData?.payment_tier === 'trial' &&
    new Date(userData.trial_ends_at) > new Date();

  const trialExpired = userData?.payment_tier === 'trial' &&
    new Date(userData.trial_ends_at) < new Date();

  // Format trial end date consistently
  const trialEndDate = userData?.trial_ends_at
    ? new Date(userData.trial_ends_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric'
      })
    : '';

  const handleCheckout = async () => {
    setIsProcessing(true);

    try {
      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: selectedAmount,
          segment: selectedSegment,
        }),
      });

      const { url } = await response.json();

      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Failed to start checkout. Please try again.');
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">Q</span>
              </div>
              <span className="font-semibold text-gray-900 text-lg">QEP AISolve</span>
            </Link>
            <Link
              href="/dashboard"
              className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Trial Expired Banner */}
        {(expired || trialExpired) && (
          <div className="mb-8 bg-warning/10 border-2 border-warning rounded-xl p-6 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 text-warning text-2xl">⏰</div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  Your 28-Day Trial Has Ended
                </h3>
                <p className="text-gray-700 mb-4">
                  To continue accessing strategic consultations and document generation, please choose a payment plan below.
                  We use Pay What You Want pricing because we believe in letting value speak for itself.
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Good news:</strong> All your previous decisions and documents are saved and will be accessible once you activate a plan.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Pay What It's Worth
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            {isTrialActive ? (
              <>
                Your trial ends on {mounted ? trialEndDate : ''}.
                Choose what to pay monthly — $10 minimum, you decide the rest.
              </>
            ) : (
              <>
                Choose what to pay monthly — $10 minimum, you decide the rest.
              </>
            )}
          </p>
        </div>

        {/* Pricing Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-8">
          {/* Segment Selection */}
          <div className="mb-8">
            <SegmentAnchors
              segments={segments}
              selectedSegment={selectedSegment}
              onSegmentSelect={setSelectedSegment}
            />
          </div>

          {/* Amount Slider */}
          <div className="mb-8">
            <PWYWSlider
              onAmountChange={setSelectedAmount}
              initialAmount={selectedAmount}
              minAmount={10}
              maxAmount={500}
            />
          </div>

          {/* Beat the Average Prompt */}
          <div className="mb-8">
            <BeatTheAverage
              userAmount={selectedAmount}
              averageAmount={averageAmount}
              onUpgrade={(newAmount) => setSelectedAmount(newAmount)}
            />
          </div>

          {/* What You Get */}
          <div className="mb-8 p-6 bg-primary-50 border border-primary-200 rounded-xl">
            <h3 className="font-semibold text-primary-900 mb-3">
              What You Get:
            </h3>
            <ul className="space-y-2 text-sm text-primary-800">
              <li className="flex items-start gap-2">
                <span className="text-primary-600 mt-0.5">✓</span>
                <span><strong>Unlimited strategic consultations</strong> — No query limits</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-600 mt-0.5">✓</span>
                <span><strong>Board-ready documents</strong> — SCQA framework with 90-day roadmaps</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-600 mt-0.5">✓</span>
                <span><strong>Risk mitigation strategies</strong> — Identify and plan for potential pitfalls</span>
              </li>
              {selectedAmount >= averageAmount && (
                <li className="flex items-start gap-2">
                  <span className="text-warning mt-0.5">⚗️</span>
                  <span><strong>Alchemy insights (Premium)</strong> — Counterintuitive options most won't consider</span>
                </li>
              )}
            </ul>
          </div>

          {/* CTA Button */}
          <button
            onClick={handleCheckout}
            disabled={isProcessing}
            className="w-full py-4 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            {isProcessing ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </span>
            ) : (
              `Subscribe for $${selectedAmount}/month`
            )}
          </button>

          <p className="text-xs text-center text-gray-500 mt-4">
            Cancel anytime. We practice what we preach: unconventional thinking includes unconventional pricing.
          </p>
        </div>

        {/* Philosophy */}
        <div className="text-center text-sm text-gray-600">
          <p className="mb-2">
            <strong>Why Pay What You Want?</strong>
          </p>
          <p className="max-w-2xl mx-auto">
            We're confident enough in our unconventional approach to price unconventionally.
            Most users pay $50-150/month. You decide what the strategic insights are worth to you.
          </p>
        </div>
      </main>
    </div>
  );
}
