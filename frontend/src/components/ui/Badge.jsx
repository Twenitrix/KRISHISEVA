/**
 * Badge — status pill indicator.
 * Variants map to status token colors.
 */

const variantClasses = {
  pending:   'bg-[var(--color-status-pending-bg)] text-[var(--color-status-pending)] border border-[var(--color-turmeric-border)]/40',
  verified:  'bg-[var(--color-status-verified-bg)] text-[var(--color-status-verified)] border border-[var(--color-accent)]/20',
  approved:  'bg-[var(--color-status-verified-bg)] text-[var(--color-status-verified)] border border-[var(--color-accent)]/20',
  rejected:  'bg-[var(--color-status-rejected-bg)] text-[var(--color-status-rejected)] border border-[var(--color-status-rejected)]/20',
  denied:    'bg-[var(--color-status-rejected-bg)] text-[var(--color-status-rejected)] border border-[var(--color-status-rejected)]/20',
  info:      'bg-[var(--color-status-info-bg)] text-[var(--color-status-info)] border border-[var(--color-status-info)]/20',
  default:   'bg-[var(--color-surface-alt)] text-[var(--color-text-secondary)] border border-[var(--color-border-default)]',
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
