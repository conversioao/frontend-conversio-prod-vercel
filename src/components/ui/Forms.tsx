import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, className = '', ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && <label className="text-sm font-medium text-text-secondary">{label}</label>}
      <input
        className={`bg-bg-base border border-border-subtle rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all ${
          error ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500' : ''
        } ${className}`}
        {...props}
      />
      {error && <span className="text-xs text-red-400">{error}</span>}
    </div>
  );
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export function Textarea({ label, error, className = '', ...props }: TextareaProps) {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && <label className="text-sm font-medium text-text-secondary">{label}</label>}
      <textarea
        className={`bg-bg-base border border-border-subtle rounded-xl px-4 py-3 text-sm text-text-primary placeholder:text-text-tertiary focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all resize-y min-h-[100px] ${
          error ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500' : ''
        } ${className}`}
        {...props}
      />
      {error && <span className="text-xs text-red-400">{error}</span>}
    </div>
  );
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { value: string; label: string }[];
}

export function Select({ label, options, className = '', ...props }: SelectProps) {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && <label className="text-sm font-medium text-text-secondary">{label}</label>}
      <div className="relative">
        <select
          className={`appearance-none w-full bg-bg-base border border-border-subtle rounded-xl px-4 py-2.5 text-sm text-text-primary focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all cursor-pointer ${className}`}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-surface text-text-primary">
              {opt.label}
            </option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-text-secondary">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m6 9 6 6 6-6"/>
          </svg>
        </div>
      </div>
    </div>
  );
}
