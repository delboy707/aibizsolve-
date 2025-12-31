'use client';

interface ExamplePromptsProps {
  onExampleClick: (prompt: string) => void;
}

const examplePrompts = [
  {
    category: 'Growth & Strategy',
    prompts: [
      "We're growing fast but margins are shrinking. How do we scale profitably?",
      "Our market is saturated. What new growth levers should we explore?",
      "We need to enter a new market but don't know where to start.",
    ],
  },
  {
    category: 'Marketing & Sales',
    prompts: [
      "Our marketing spend keeps increasing but revenue is flat. What's wrong?",
      "We get leads but conversion rates are dropping. How do we fix this?",
      "Our brand feels invisible next to competitors. How do we stand out?",
    ],
  },
  {
    category: 'Operations & Efficiency',
    prompts: [
      "We're constantly firefighting. How do we build systems that scale?",
      "Our team is overworked but productivity is low. What should we change?",
      "We waste time on tasks that don't drive revenue. Where do we focus?",
    ],
  },
  {
    category: 'People & Culture',
    prompts: [
      "We can't hire fast enough and keep losing good people. What's the fix?",
      "Our team doesn't feel aligned on where we're going. How do we fix this?",
      "We hired managers but they're not leading. How do we develop them?",
    ],
  },
];

export default function ExamplePrompts({ onExampleClick }: ExamplePromptsProps) {
  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          What business challenge are you facing?
        </h1>
        <p className="text-gray-600 text-lg mb-6">
          Describe your problem in plain English, or choose an example below to get started.
        </p>

        {/* What to Expect */}
        <div className="bg-primary-50 border border-primary-200 rounded-xl p-6 text-left shadow-sm">
          <h3 className="font-semibold text-primary-900 mb-3 flex items-center gap-2">
            <span>ℹ️</span>
            <span>What happens next:</span>
          </h3>
          <ol className="space-y-2 text-sm text-primary-800">
            <li className="flex gap-3">
              <span className="font-bold">1.</span>
              <span><strong>You describe your problem</strong> — Be specific about what's not working</span>
            </li>
            <li className="flex gap-3">
              <span className="font-bold">2.</span>
              <span><strong>Claude asks 2-4 questions</strong> — To understand context, constraints, and what you've tried</span>
            </li>
            <li className="flex gap-3">
              <span className="font-bold">3.</span>
              <span><strong>Click "Generate Document"</strong> — Appears after 3+ messages (takes ~2 minutes)</span>
            </li>
            <li className="flex gap-3">
              <span className="font-bold">4.</span>
              <span><strong>Review two types of insights:</strong> Strategic analysis (SCQA) + Counterintuitive options (Alchemy)</span>
            </li>
          </ol>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {examplePrompts.map((category) => (
          <div
            key={category.category}
            className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm"
          >
            <h3 className="font-semibold text-gray-900 mb-4">{category.category}</h3>
            <div className="space-y-2">
              {category.prompts.map((prompt, index) => (
                <button
                  key={index}
                  onClick={() => onExampleClick(prompt)}
                  className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 hover:border-primary-300 border border-gray-200 rounded-lg text-sm text-gray-700 transition-all"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 text-center text-sm text-gray-500">
        <p>
          Not sure how to phrase it? Just start typing — we'll ask clarifying questions to
          understand your specific situation.
        </p>
      </div>
    </div>
  );
}
