import React, { useState, useRef, useEffect } from 'react';

interface Option {
  value: string | number;
  label: string;
}

interface CustomSelectProps {
  value: string | number;
  options: Option[];
  onChange: (value: any) => void;
  className?: string;
  disabled?: boolean;
}

export const CustomSelect: React.FC<CustomSelectProps> = ({ value, options, onChange, className = '', disabled = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(o => o.value === value) || options[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div 
      className={`relative ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      ref={containerRef}
    >
      <div 
        className={`glass-input w-full rounded-lg py-2 px-3 text-sm text-white outline-none bg-black/40 border border-white/10 transition-colors flex items-center justify-between ${disabled ? '' : 'hover:border-white/20 focus:border-emerald-500 cursor-pointer'}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <span className="truncate">{selectedOption?.label}</span>
        <svg className={`w-4 h-4 transition-transform flex-shrink-0 ml-2 ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
      
      {isOpen && !disabled && (
        <div className="absolute z-50 w-full mt-1 bg-[#1e1e1e] border border-white/10 rounded-lg shadow-xl overflow-hidden max-h-60 overflow-y-auto">
          {options.map((option, index) => (
            <div 
              key={index}
              className={`px-3 py-2 text-sm text-white cursor-pointer hover:bg-white/10 ${value === option.value ? 'bg-white/5 text-emerald-400' : ''}`}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
            >
              {option.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
