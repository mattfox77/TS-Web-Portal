/**
 * Accessible form components with WCAG 2.1 Level AA compliance
 */

import React, { useId } from 'react';
import { generateAriaId, createAccessibleLabel } from '@/lib/accessibility';

interface FormFieldProps {
  label: string;
  name: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url';
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  helpText?: string;
  autoComplete?: string;
  className?: string;
}

/**
 * Accessible text input field with proper ARIA labels and error handling
 */
export function AccessibleInput({
  label,
  name,
  type = 'text',
  value,
  onChange,
  error,
  required = false,
  disabled = false,
  placeholder,
  helpText,
  autoComplete,
  className = '',
}: FormFieldProps) {
  const inputId = useId();
  const errorId = `${inputId}-error`;
  const helpId = `${inputId}-help`;

  return (
    <div className={`space-y-1 ${className}`}>
      <label
        htmlFor={inputId}
        className="block text-sm font-medium text-gray-700"
      >
        {createAccessibleLabel(label, required)}
      </label>

      {helpText && (
        <p id={helpId} className="text-sm text-gray-500">
          {helpText}
        </p>
      )}

      <input
        id={inputId}
        name={name}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        required={required}
        placeholder={placeholder}
        autoComplete={autoComplete}
        aria-invalid={!!error}
        aria-describedby={`${error ? errorId : ''} ${helpText ? helpId : ''}`.trim() || undefined}
        aria-required={required}
        className={`
          input-mobile
          ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}
          ${disabled ? 'cursor-not-allowed bg-gray-100 opacity-60' : ''}
        `}
      />

      {error && (
        <p id={errorId} className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

interface TextAreaProps extends Omit<FormFieldProps, 'type'> {
  rows?: number;
}

/**
 * Accessible textarea field
 */
export function AccessibleTextArea({
  label,
  name,
  value,
  onChange,
  error,
  required = false,
  disabled = false,
  placeholder,
  helpText,
  rows = 4,
  className = '',
}: TextAreaProps) {
  const textareaId = useId();
  const errorId = `${textareaId}-error`;
  const helpId = `${textareaId}-help`;

  return (
    <div className={`space-y-1 ${className}`}>
      <label
        htmlFor={textareaId}
        className="block text-sm font-medium text-gray-700"
      >
        {createAccessibleLabel(label, required)}
      </label>

      {helpText && (
        <p id={helpId} className="text-sm text-gray-500">
          {helpText}
        </p>
      )}

      <textarea
        id={textareaId}
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        required={required}
        placeholder={placeholder}
        rows={rows}
        aria-invalid={!!error}
        aria-describedby={`${error ? errorId : ''} ${helpText ? helpId : ''}`.trim() || undefined}
        aria-required={required}
        className={`
          input-mobile resize-y
          ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}
          ${disabled ? 'cursor-not-allowed bg-gray-100 opacity-60' : ''}
        `}
      />

      {error && (
        <p id={errorId} className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

interface SelectProps {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  helpText?: string;
  placeholder?: string;
  className?: string;
}

/**
 * Accessible select dropdown
 */
export function AccessibleSelect({
  label,
  name,
  value,
  onChange,
  options,
  error,
  required = false,
  disabled = false,
  helpText,
  placeholder,
  className = '',
}: SelectProps) {
  const selectId = useId();
  const errorId = `${selectId}-error`;
  const helpId = `${selectId}-help`;

  return (
    <div className={`space-y-1 ${className}`}>
      <label
        htmlFor={selectId}
        className="block text-sm font-medium text-gray-700"
      >
        {createAccessibleLabel(label, required)}
      </label>

      {helpText && (
        <p id={helpId} className="text-sm text-gray-500">
          {helpText}
        </p>
      )}

      <select
        id={selectId}
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        required={required}
        aria-invalid={!!error}
        aria-describedby={`${error ? errorId : ''} ${helpText ? helpId : ''}`.trim() || undefined}
        aria-required={required}
        className={`
          input-mobile
          ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}
          ${disabled ? 'cursor-not-allowed bg-gray-100 opacity-60' : ''}
        `}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      {error && (
        <p id={errorId} className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

interface CheckboxProps {
  label: string;
  name: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  error?: string;
  disabled?: boolean;
  helpText?: string;
  className?: string;
}

/**
 * Accessible checkbox input
 */
export function AccessibleCheckbox({
  label,
  name,
  checked,
  onChange,
  error,
  disabled = false,
  helpText,
  className = '',
}: CheckboxProps) {
  const checkboxId = useId();
  const errorId = `${checkboxId}-error`;
  const helpId = `${checkboxId}-help`;

  return (
    <div className={`space-y-1 ${className}`}>
      <div className="flex items-start">
        <div className="flex h-5 items-center">
          <input
            id={checkboxId}
            name={name}
            type="checkbox"
            checked={checked}
            onChange={(e) => onChange(e.target.checked)}
            disabled={disabled}
            aria-invalid={!!error}
            aria-describedby={`${error ? errorId : ''} ${helpText ? helpId : ''}`.trim() || undefined}
            className={`
              h-5 w-5 rounded border-gray-300 text-blue-600
              focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
              ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}
            `}
          />
        </div>
        <div className="ml-3">
          <label
            htmlFor={checkboxId}
            className={`text-sm font-medium text-gray-700 ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
          >
            {label}
          </label>
          {helpText && (
            <p id={helpId} className="text-sm text-gray-500">
              {helpText}
            </p>
          )}
        </div>
      </div>

      {error && (
        <p id={errorId} className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  ariaLabel?: string;
  className?: string;
}

/**
 * Accessible button component with loading state
 */
export function AccessibleButton({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  ariaLabel,
  className = '',
}: ButtonProps) {
  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    ghost: 'bg-transparent text-gray-700 hover:bg-gray-100 focus:ring-gray-500',
  };

  const sizeClasses = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-3 text-base',
    lg: 'px-6 py-4 text-lg',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      aria-label={ariaLabel}
      aria-busy={loading}
      className={`
        btn-mobile
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${disabled || loading ? 'cursor-not-allowed opacity-60' : ''}
        ${className}
      `}
    >
      {loading && (
        <svg
          className="mr-2 h-4 w-4 animate-spin"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {children}
    </button>
  );
}
