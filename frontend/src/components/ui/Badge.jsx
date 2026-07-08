/**
 * Badge — status pill indicator.
 * Variants map to status token colors.
 */

const variantClasses = {
  pending:   'bg-status-pending-bg text-status-pending',
  verified:  'bg-status-verified-bg text-status-verified',
  approved:  'bg-status-verified-bg text-status-verified',
  rejected:  'bg-status-rejected-bg text-status-rejected',
  denied:    'bg-status-rejected-bg text-status-rejected',
  info:      'bg-status-info-bg text-status-info',
  default:   'bg-surface-alt text-text-secondary',
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
        px-2.5 py-0.5
        text-xs font-medium
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
