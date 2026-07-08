/**
 * Table — composable table components for dense data display.
 * Responsive: horizontal scroll on mobile.
 * Alternating row backgrounds with surface-alt.
 */

export function Table({ children, className = '' }) {
  return (
    <div className="w-full overflow-x-auto rounded-lg border border-border-default">
      <table className={`w-full text-sm text-left ${className}`}>
        {children}
      </table>
    </div>
  );
}

export function TableHead({ children, className = '' }) {
  return (
    <thead className={`bg-surface-alt text-text-secondary text-xs uppercase tracking-wide ${className}`}>
      {children}
    </thead>
  );
}

export function TableBody({ children, className = '' }) {
  return <tbody className={`divide-y divide-border-default ${className}`}>{children}</tbody>;
}

export function TableRow({ children, className = '', onClick, highlighted = false }) {
  return (
    <tr
      onClick={onClick}
      className={`
        bg-surface
        transition-colors duration-100
        ${onClick ? 'cursor-pointer hover:bg-accent-light/50' : 'even:bg-surface-alt/50'}
        ${highlighted ? 'bg-accent-light/30' : ''}
        ${className}
      `}
    >
      {children}
    </tr>
  );
}

export function TableCell({ children, className = '', header = false }) {
  const Tag = header ? 'th' : 'td';
  return (
    <Tag
      className={`
        px-4 py-3 whitespace-nowrap
        ${header ? 'font-medium text-text-secondary' : 'text-text-primary'}
        ${className}
      `}
    >
      {children}
    </Tag>
  );
}

/**
 * EmptyTable — placeholder when table has no rows.
 */
export function EmptyTable({ message, hint, colSpan = 1 }) {
  return (
    <TableBody>
      <TableRow>
        <TableCell colSpan={colSpan} className="text-center py-12">
          <p className="text-text-secondary font-medium">{message}</p>
          {hint && <p className="text-text-muted text-xs mt-1">{hint}</p>}
        </TableCell>
      </TableRow>
    </TableBody>
  );
}
