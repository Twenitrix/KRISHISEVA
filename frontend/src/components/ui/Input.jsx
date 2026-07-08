import { forwardRef } from 'react';

/**
 * Input — form text input with label, helper text, and error state.
 * Touch-friendly padding, visible focus ring.
 */

const Input = forwardRef(function Input(
  {
    label,
    error,
    helperText,
    id,
    className = '',
    containerClass = '',
    size = 'md',
    ...props
  },
  ref
) {
  const inputId = id || props.name || label?.toLowerCase().replace(/\s+/g, '-');

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm min-h-[36px]',
    md: 'px-3.5 py-2.5 text-base min-h-[44px]',
    lg: 'px-4 py-3 text-base min-h-[52px]',
  };

  return (
    <div className={`flex flex-col gap-1.5 ${containerClass}`}>
      {label && (
        <label
          htmlFor={inputId}
          className="text-sm font-medium text-text-primary"
        >
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        className={`
          w-full rounded-md
          border bg-surface text-text-primary
          placeholder:text-text-muted
          transition-colors duration-150
          focus:outline-none focus:ring-2 focus:ring-border-focus/40 focus:border-border-focus
          disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-surface-alt
          ${error
            ? 'border-status-rejected focus:ring-status-rejected/30'
            : 'border-border-default'
          }
          ${sizeClasses[size] || sizeClasses.md}
          ${className}
        `}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={
          error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined
        }
        {...props}
      />
      {error && (
        <p id={`${inputId}-error`} className="text-xs text-status-rejected" role="alert">
          {error}
        </p>
      )}
      {!error && helperText && (
        <p id={`${inputId}-helper`} className="text-xs text-text-muted">
          {helperText}
        </p>
      )}
    </div>
  );
});

export default Input;
