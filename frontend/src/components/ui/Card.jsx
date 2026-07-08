/**
 * Card — container for content sections.
 * White surface, subtle border, shadow-card, rounded-lg.
 */

export default function Card({ children, className = '', padding = true, ...props }) {
  return (
    <div
      className={`
        bg-surface border border-border-default rounded-lg shadow-card
        ${padding ? 'p-5' : ''}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * CardHeader — optional header section with bottom border.
 */
export function CardHeader({ children, className = '' }) {
  return (
    <div className={`pb-4 mb-4 border-b border-border-default ${className}`}>
      {children}
    </div>
  );
}

/**
 * CardTitle — heading inside a card.
 */
export function CardTitle({ children, className = '' }) {
  return (
    <h3 className={`text-lg font-semibold text-text-primary ${className}`}>
      {children}
    </h3>
  );
}

/**
 * CardFooter — optional footer section with top border.
 */
export function CardFooter({ children, className = '' }) {
  return (
    <div className={`pt-4 mt-4 border-t border-border-default ${className}`}>
      {children}
    </div>
  );
}
