'use client';

import { useState } from 'react';

interface PWYWSliderProps {
  onAmountChange: (amount: number) => void;
  initialAmount?: number;
  minAmount?: number;
  maxAmount?: number;
}

export default function PWYWSlider({
  onAmountChange,
  initialAmount = 50,
  minAmount = 10,
  maxAmount = 500,
}: PWYWSliderProps) {
  const [amount, setAmount] = useState(initialAmount);
  const [customInput, setCustomInput] = useState(false);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    setAmount(value);
    onAmountChange(value);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || minAmount;
    const clampedValue = Math.max(minAmount, Math.min(maxAmount, value));
    setAmount(clampedValue);
    onAmountChange(clampedValue);
  };

  const quickAmounts = [10, 25, 50, 100, 150, 250];

  return (
    <div className="space-y-6">
      {/* Amount Display */}
      <div className="text-center">
        <div className="flex items-baseline justify-center gap-2">
          <span className="text-5xl font-bold text-navy-dark">
            ${customInput ? (
              <input
                type="number"
                value={amount}
                onChange={handleInputChange}
                onBlur={() => setCustomInput(false)}
                className="w-32 text-center border-b-2 border-navy-primary focus:outline-none"
                autoFocus
                min={minAmount}
                max={maxAmount}
              />
            ) : (
              <button
                onClick={() => setCustomInput(true)}
                className="hover:text-navy-primary transition-colors"
              >
                {amount}
              </button>
            )}
          </span>
          <span className="text-2xl text-slate-600">/month</span>
        </div>
        <p className="text-sm text-slate-500 mt-2">
          Click amount to type a custom value
        </p>
      </div>

      {/* Slider */}
      <div className="px-4">
        <input
          type="range"
          min={minAmount}
          max={maxAmount}
          value={amount}
          onChange={handleSliderChange}
          className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer slider-thumb"
          style={{
            background: `linear-gradient(to right, #1A365D 0%, #1A365D ${((amount - minAmount) / (maxAmount - minAmount)) * 100}%, #E2E8F0 ${((amount - minAmount) / (maxAmount - minAmount)) * 100}%, #E2E8F0 100%)`
          }}
        />
        <div className="flex justify-between text-xs text-slate-500 mt-2">
          <span>${minAmount}</span>
          <span>${maxAmount}+</span>
        </div>
      </div>

      {/* Quick Amount Buttons */}
      <div className="grid grid-cols-3 gap-2">
        {quickAmounts.map((quickAmount) => (
          <button
            key={quickAmount}
            onClick={() => {
              setAmount(quickAmount);
              onAmountChange(quickAmount);
            }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              amount === quickAmount
                ? 'bg-navy-primary text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            ${quickAmount}
          </button>
        ))}
      </div>
    </div>
  );
}
