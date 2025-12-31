'use client';

interface BeatTheAverageProps {
  userAmount: number;
  averageAmount: number;
  onUpgrade: (newAmount: number) => void;
}

export default function BeatTheAverage({
  userAmount,
  averageAmount,
  onUpgrade,
}: BeatTheAverageProps) {
  const difference = averageAmount - userAmount;
  const isBelowAverage = userAmount < averageAmount;

  if (!isBelowAverage) {
    return (
      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
        <p className="text-sm text-green-800 font-medium">
          ✨ You're at or above the average! You'll get full access to Alchemy insights.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-amber-50 border-2 border-amber-300 rounded-lg">
      <div className="flex items-start gap-4">
        <span className="text-3xl">⚗️</span>
        <div className="flex-1">
          <h3 className="font-semibold text-amber-900 mb-2">
            Unlock Alchemy Insights
          </h3>
          <p className="text-sm text-amber-800 mb-4">
            You're currently ${difference.toFixed(0)} below the average for your segment.
            Pay <strong>${averageAmount}/month</strong> or more to unlock counterintuitive options
            that most consultants won't consider.
          </p>

          <div className="bg-white/50 p-3 rounded-lg mb-4">
            <p className="text-xs text-amber-900 font-medium mb-2">
              What you'll unlock:
            </p>
            <ul className="text-xs text-amber-800 space-y-1">
              <li>• <strong>The Opposite Lens</strong> — What if we did the reverse?</li>
              <li>• <strong>The Perception Lens</strong> — Change how it feels, not what it is</li>
              <li>• <strong>The Signal Lens</strong> — Make it feel valuable without changing substance</li>
              <li>• <strong>The Small Bet Lens</strong> — Low-cost interventions with outsized impact</li>
            </ul>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => onUpgrade(averageAmount)}
              className="flex-1 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors font-medium text-sm"
            >
              Upgrade to ${averageAmount}/month
            </button>
            <button
              onClick={() => onUpgrade(Math.round(averageAmount * 1.2))}
              className="flex-1 px-4 py-2 bg-navy-primary text-white rounded-lg hover:bg-navy-light transition-colors font-medium text-sm"
            >
              I'll pay more: ${Math.round(averageAmount * 1.2)}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
