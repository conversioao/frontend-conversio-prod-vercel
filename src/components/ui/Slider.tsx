import React from 'react';

interface SliderProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  valueLabel?: string;
}

export function Slider({ label, value, min, max, step = 1, onChange, valueLabel, className = '', ...props }: SliderProps) {
  // Calculate percentage for the fill effect
  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className={`flex flex-col gap-3 w-full ${className}`}>
      {(label || valueLabel) && (
        <div className="flex justify-between items-center">
          {label && <label className="text-sm font-medium text-text-secondary">{label}</label>}
          {valueLabel && <span className="text-xs font-mono text-text-primary">{valueLabel}</span>}
        </div>
      )}
      
      <div className="relative h-2 flex items-center">
        {/* Custom Track */}
        <div className="absolute w-full h-1.5 bg-bg-base border border-border-subtle rounded-full overflow-hidden">
          {/* Custom Fill */}
          <div 
            className="h-full bg-accent transition-all duration-150 ease-out"
            style={{ width: `${percentage}%` }}
          />
        </div>
        
        {/* Native Input (Invisible but functional, thumb styled) */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={onChange}
          className="absolute w-full h-full opacity-0 cursor-pointer z-10"
          {...props}
        />
        
        {/* Custom Thumb (Visual only, follows the value) */}
        <div 
          className="absolute h-4 w-4 bg-accent rounded-full shadow-glow pointer-events-none transition-all duration-150 ease-out z-0"
          style={{ left: `calc(${percentage}% - 8px)` }}
        />
      </div>
      
      {/* Min/Max Labels */}
      <div className="flex justify-between text-[10px] text-text-tertiary uppercase tracking-wider mt-1">
        <span>Low</span>
        <span>High</span>
      </div>
    </div>
  );
}
