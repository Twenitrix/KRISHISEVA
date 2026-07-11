/**
 * Badge — status pill indicator.
 * Variants map to status token colors.
 */

const variantClasses = {
  pending:   'bg-amber-50 text-amber-700 border border-amber-200/50',
  verified:  'bg-emerald-50 text-emerald-700 border border-emerald-200/50',
  approved:  'bg-emerald-50 text-emerald-700 border border-emerald-200/50',
  rejected:  'bg-rose-50 text-rose-700 border border-rose-200/50',
  denied:    'bg-rose-50 text-rose-700 border border-rose-200/50',
  info:      'bg-blue-50 text-blue-700 border border-blue-200/50',
  default:   'bg-slate-50 text-slate-600 border border-slate-200/50',
};

/**
 * Map claim status strings from the backend to badge variants.
 */
const statusToVariant = {
  filed: 'pending',
  under_review: 'pending',
  verified: 'verified',
  approved: 'approved',
  denied: 'rejected',
  rejected: 'rejected',
  payout_initiated: 'info',
  payout_completed: 'approved',
};

export default function Badge({ children, variant, status, className = '' }) {
  // Allow passing a raw status string — auto-map to variant
  const resolvedVariant = variant || statusToVariant[status] || 'default';

  return (
    <span
      className={`
        inline-flex items-center
        px-3 py-1
        text-[11px] font-bold tracking-wide uppercase
        rounded-full
        whitespace-nowrap
        ${variantClasses[resolvedVariant] || variantClasses.default}
        ${className}
      `}
    >
      {children}
    </span>
  );
}
