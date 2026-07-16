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
    sm: 'px-3 py-2 text-sm min-h-[38px] rounded-lg',
    md: 'px-4 py-2.5 text-base min-h-[46px] rounded-xl',
    lg: 'px-5 py-3.5 text-base min-h-[54px] rounded-2xl',
  };

  return (
    <div className={`flex flex-col gap-1.5 ${containerClass}`}>
      {label && (
        <label
          htmlFor={inputId}
          className="text-xs font-bold uppercase tracking-wider text-text-secondary"
        >
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        className={`
          w-full
          border bg-white text-[var(--color-text-primary)]
          placeholder:text-[var(--color-text-muted)]
          transition-all duration-200
          focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/20 focus:border-[var(--color-accent)] focus:shadow-sm
          disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-[var(--color-paper)]
          ${error
            ? 'border-status-rejected focus:ring-status-rejected/20 focus:border-status-rejected'
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
        <p id={`${inputId}-error`} className="text-xs font-medium text-status-rejected mt-0.5" role="alert">
          {error}
        </p>
      )}
      {!error && helperText && (
        <p id={`${inputId}-helper`} className="text-xs text-text-muted mt-0.5">
          {helperText}
        </p>
      )}
    </div>
  );
});

export default Input;
