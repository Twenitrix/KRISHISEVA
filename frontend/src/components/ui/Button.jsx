import { forwardRef } from 'react';

/**
 * Button — primary interactive element.
 *
 * Variants: primary | secondary | danger | ghost
 * Sizes: sm | md | lg (lg = farmer-facing large touch targets)
 */

const variantClasses = {
  primary:
    'bg-accent text-white hover:bg-accent-hover active:bg-accent-hover focus-visible:ring-2 focus-visible:ring-accent/40',
  secondary:
    'bg-surface text-text-primary border border-border-default hover:bg-surface-alt active:bg-surface-alt',
  danger:
    'bg-status-rejected text-white hover:bg-status-rejected/90 active:bg-status-rejected/80',
  ghost:
    'bg-transparent text-text-secondary hover:bg-surface-alt active:bg-surface-alt',
};

const sizeClasses = {
  sm: 'px-3 py-1.5 text-sm min-h-[36px]',
  md: 'px-4 py-2.5 text-sm min-h-[44px]',
  lg: 'px-6 py-3 text-base min-h-[52px]',
};

const Button = forwardRef(function Button(
  {
    children,
    variant = 'primary',
    size = 'md',
    loading = false,
    disabled = false,
    className = '',
    type = 'button',
    ...props
  },
  ref
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      className={`
        inline-flex items-center justify-center gap-2
        font-medium rounded-md
        transition-colors duration-150
        cursor-pointer
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variantClasses[variant] || variantClasses.primary}
        ${sizeClasses[size] || sizeClasses.md}
        ${className}
      `}
      {...props}
    >
      {loading && (
        <svg
          className="animate-spin h-4 w-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
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
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      )}
      {children}
    </button>
  );
});

export default Button;
