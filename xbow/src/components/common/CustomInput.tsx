import React, { useState } from 'react';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

interface InputProps {
  id?: string;
  label?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'date' | 'time';
  required?: boolean;
  disabled?: boolean;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  className?: string;
  rows?: number;
  multiline?: boolean;
}

export const Input: React.FC<InputProps> = ({
  label,
  placeholder,
  value,
  onChange,
  type = 'text',
  required = false,
  disabled = false,
  error,
  helperText,
  leftIcon,
  rightIcon,
  className = '',
  rows = 3,
  multiline = false
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const inputType = type === 'password' && showPassword ? 'text' : type;

  const baseClasses = `
    w-full px-4 py-3 text-base border-2 rounded-xl transition-all duration-200
    focus:outline-none focus:ring-4 focus:ring-opacity-20
    disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed
    ${leftIcon ? 'pl-12' : ''}
    ${rightIcon || type === 'password' ? 'pr-12' : ''}
  `;

  const stateClasses = error
    ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
    : isFocused
    ? 'border-blue-500 focus:border-blue-600 focus:ring-blue-500'
    : 'border-slate-300 hover:border-slate-400';

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label className="block text-sm font-semibold text-slate-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        {leftIcon && (
          <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400">
            {leftIcon}
          </div>
        )}
        
        {multiline ? (
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            required={required}
            disabled={disabled}
            rows={rows}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            className={`${baseClasses} ${stateClasses} resize-none`}
          />
        ) : (
          <input
            type={inputType}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            required={required}
            disabled={disabled}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            className={`${baseClasses} ${stateClasses}`}
          />
        )}
        
        {type === 'password' && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            {showPassword ? (
              <EyeSlashIcon className="w-5 h-5" />
            ) : (
              <EyeIcon className="w-5 h-5" />
            )}
          </button>
        )}
        
        {rightIcon && type !== 'password' && (
          <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400">
            {rightIcon}
          </div>
        )}
      </div>
      
      {error && (
        <p className="text-sm text-red-600 font-medium">{error}</p>
      )}
      
      {helperText && !error && (
        <p className="text-sm text-slate-500">{helperText}</p>
      )}
    </div>
  );
};