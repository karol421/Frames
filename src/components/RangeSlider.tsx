import React from 'react';

interface RangeSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  formatValue?: (val: number) => string;
  onChange: (value: number) => void;
}

export const RangeSlider: React.FC<RangeSliderProps> = ({
  label,
  value,
  min,
  max,
  step = 0.01,
  unit = '',
  formatValue,
  onChange,
}) => {
  const display = formatValue
    ? formatValue(value)
    : `${step >= 1 ? Math.round(value) : value.toFixed(2)}${unit}`;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-3">
        <label className="text-xs font-medium text-[#B8B8C2] truncate">{label}</label>
        <span className="text-xs font-mono-tabular text-[#F4F4F0] shrink-0">{display}</span>
      </div>
      <input
        type="range"
        className="studio-slider"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
      />
    </div>
  );
};
