import { forwardRef } from 'react';

/**
 * Button — primary interactive element.
 *
 * Variants: primary | secondary | danger | ghost
 * Sizes: sm | md | lg (lg = farmer-facing large touch targets)
 */

const variantClasses = {
  primary:
    'bg-gradient-to-r from-emerald-600 to-teal-500 text-white hover:shadow-md hover:shadow-emerald-500/20 active:opacity-95 focus-visible:ring-2 focus-visible:ring-emerald-500/40 btn-glow',
  secondary:
    'bg-white text-text-primary border border-border-default hover:bg-slate-50 active:bg-slate-100 shadow-sm',
  danger:
    'bg-gradient-to-r from-red-600 to-rose-500 text-white hover:shadow-md hover:shadow-red-500/20 active:opacity-95',
  ghost:
    'bg-transparent text-text-secondary hover:bg-slate-100 active:bg-slate-200',
};

const sizeClasses = {
  sm: 'px-4 py-2 text-sm min-h-[38px] rounded-lg',
  md: 'px-5 py-2.5 text-sm font-semibold min-h-[46px] rounded-xl',
  lg: 'px-8 py-3.5 text-base font-bold min-h-[54px] rounded-2xl tracking-wide',
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
        inline-flex items-center justify-center gap-2.5
        font-medium
        transition-all duration-200
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
