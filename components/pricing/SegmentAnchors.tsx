'use client';

interface SegmentAnchorsProps {
  segments: {
    segment: string;
    average_payment: number;
    median_payment: number;
  }[];
  selectedSegment?: string;
  onSegmentSelect?: (segment: string) => void;
}

const segmentLabels: Record<string, string> = {
  solopreneur: 'Solopreneurs',
  small_business: 'Small Business Owners',
  manager: 'Senior Managers',
  ceo: 'CEOs/Founders',
};

const segmentDescriptions: Record<string, string> = {
  solopreneur: 'Freelancers, consultants, solo founders',
  small_business: '2-50 employees, growing companies',
  manager: 'Department heads, VPs at mid-large companies',
  ceo: 'C-suite executives, founders of funded startups',
};

export default function SegmentAnchors({
  segments,
  selectedSegment,
  onSegmentSelect,
}: SegmentAnchorsProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-navy-dark text-center">
        What do others like you pay?
      </h3>
      <p className="text-sm text-slate-600 text-center">
        Choose your segment to see what similar users typically contribute
      </p>

      <div className="grid md:grid-cols-2 gap-3">
        {segments.map(({ segment, average_payment, median_payment }) => (
          <button
            key={segment}
            onClick={() => onSegmentSelect?.(segment)}
            className={`p-4 rounded-lg border-2 transition-all text-left ${
              selectedSegment === segment
                ? 'border-navy-primary bg-navy-primary/5'
                : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-start justify-between mb-2">
              <div>
                <h4 className="font-semibold text-navy-dark">
                  {segmentLabels[segment] || segment}
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  {segmentDescriptions[segment]}
                </p>
              </div>
              {selectedSegment === segment && (
                <span className="text-navy-primary">✓</span>
              )}
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-navy-primary">
                ${Math.round(average_payment)}
              </span>
              <span className="text-sm text-slate-600">/month avg</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Median: ${Math.round(median_payment)}/month
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}
