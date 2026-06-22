import { useState, useRef, useEffect } from 'react';

interface Option {
  value: string;
  label: string;
}

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  icon?: string;
  error?: boolean;
  disabled?: boolean;
}

export function CustomSelect({ value, onChange, options, placeholder = "Select an option", icon, error, disabled }: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(opt => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`group w-full flex items-center justify-between bg-surface rounded-2xl border ${
          error ? 'border-error ring-2 ring-error/20' : 
          isOpen ? 'border-primary ring-2 ring-primary/20' : 
          'border-outline-variant hover:border-primary/50 hover:shadow-md hover:-translate-y-0.5'
        } px-4 py-3 text-body-sm font-medium transition-all duration-300 outline-none ${
          disabled ? 'opacity-60 cursor-not-allowed hover:-translate-y-0 hover:shadow-none hover:border-outline-variant' : ''
        }`}
      >
        <div className="flex items-center gap-2 truncate text-on-surface">
          {icon && <span className="material-symbols-outlined text-[18px] text-on-surface-variant group-hover:scale-110 group-hover:text-primary transition-all duration-300">{icon}</span>}
          <span className={selectedOption ? 'text-on-surface' : 'text-on-surface-variant group-hover:text-on-surface transition-colors'}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>
        <span className={`material-symbols-outlined text-[20px] text-on-surface-variant transition-all duration-300 group-hover:text-primary ${isOpen ? 'rotate-180 text-primary' : 'group-hover:-translate-y-0.5'}`}>
          expand_more
        </span>
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-surface/95 backdrop-blur-xl rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-outline-variant/40 overflow-hidden animate-fade-in origin-top">
          <div className="max-h-48 overflow-y-auto custom-scrollbar">
            <ul className="py-2 flex flex-col">
            {options.map((option) => (
              <li key={option.value}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-5 py-3 text-body-sm transition-all duration-300 hover:bg-surface-container-high hover:pl-7 flex items-start justify-between gap-3 group
                    ${value === option.value ? 'bg-primary/5 text-primary font-bold' : 'text-on-surface'}
                  `}
                >
                  <span className="whitespace-normal leading-tight flex-1 group-hover:text-primary transition-colors">{option.label}</span>
                  {value === option.value && (
                    <span className="material-symbols-outlined text-[20px] text-primary flex-shrink-0">check</span>
                  )}
                </button>
              </li>
            ))}
            {options.length === 0 && (
              <li className="px-5 py-4 text-body-sm text-on-surface-variant text-center">
                No options available
              </li>
            )}
          </ul>
          </div>
        </div>
      )}
    </div>
  );
}
