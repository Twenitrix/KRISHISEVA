import { t } from '../../i18n';

/**
 * StatusTimeline — vertical claim lifecycle tracker.
 * Steps: Filed → Under Review → Verified → Approved → Payout
 * Active step highlighted, completed steps checked.
 * Single allowed animation: subtle transition on status change.
 */

const CLAIM_STEPS = [
  { key: 'filed', label: () => t('status.filed') },
  { key: 'under_review', label: () => t('status.under_review') },
  { key: 'verified', label: () => t('status.verified') },
  { key: 'approved', label: () => t('status.approved') },
  { key: 'payout_initiated', label: () => t('status.payout_initiated') },
];

const DENIED_STEP = { key: 'denied', label: () => t('status.denied') };

function getStepIndex(status) {
  return CLAIM_STEPS.findIndex((s) => s.key === status);
}

export default function StatusTimeline({
  currentStatus,
  statusLogs = [],
  className = '',
}) {
  const isDenied = currentStatus === 'denied' || currentStatus === 'rejected';
  const activeIndex = isDenied ? -1 : getStepIndex(currentStatus);

  // If denied, show all steps up to where it was denied, then the denied step
  const steps = isDenied
    ? [...CLAIM_STEPS.slice(0, Math.max(getStepIndex('under_review') + 1, 1)), DENIED_STEP]
    : CLAIM_STEPS;

  return (
    <div className={`flex flex-col gap-0 ${className}`} role="list" aria-label="Claim status timeline">
      {steps.map((step, index) => {
        const isCompleted = !isDenied && index < activeIndex;
        const isActive = isDenied
          ? step.key === 'denied'
          : index === activeIndex;
        const isFuture = !isDenied && index > activeIndex;
        const isLast = index === steps.length - 1;

        // Find matching log for timestamp
        const log = statusLogs.find((l) => l.new_status === step.key);

        return (
          <div key={step.key} className="flex gap-3" role="listitem">
            {/* Line + Circle */}
            <div className="flex flex-col items-center">
              {/* Circle */}
              <div
                className={`
                  w-7 h-7 rounded-full flex items-center justify-center
                  border-2 transition-all duration-500 ease-out
                  flex-shrink-0
                  ${isCompleted
                    ? 'bg-status-verified border-status-verified'
                    : isActive && isDenied
                      ? 'bg-status-rejected border-status-rejected'
                      : isActive
                        ? 'bg-accent border-accent'
                        : 'bg-surface border-border-default'
                  }
                `}
              >
                {isCompleted ? (
                  <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : isActive && isDenied ? (
                  <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : isActive ? (
                  <div className="w-2 h-2 rounded-full bg-white" />
                ) : (
                  <div className="w-2 h-2 rounded-full bg-border-default" />
                )}
              </div>

              {/* Connecting line */}
              {!isLast && (
                <div
                  className={`
                    w-0.5 flex-1 min-h-[32px]
                    transition-colors duration-500
                    ${isCompleted ? 'bg-status-verified' : 'bg-border-default'}
                  `}
                />
              )}
            </div>

            {/* Content */}
            <div className={`pb-6 ${isLast ? 'pb-0' : ''}`}>
              <p
                className={`
                  text-sm font-medium leading-7
                  ${isCompleted || isActive ? 'text-text-primary' : 'text-text-muted'}
                  ${isActive && isDenied ? 'text-status-rejected' : ''}
                `}
              >
                {step.label()}
              </p>
              {log && (
                <p className="text-xs text-text-muted mt-0.5">
                  {new Date(log.timestamp).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              )}
              {log?.remarks && (
                <p className="text-xs text-text-secondary mt-0.5 italic">
                  {log.remarks}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
