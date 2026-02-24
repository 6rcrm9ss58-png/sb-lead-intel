interface StatusBadgeProps {
  status: 'pending' | 'validating' | 'researching' | 'complete' | 'invalid';
  className?: string;
}

export default function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const statusConfig: Record<string, { label: string; color: string }> = {
    pending: { label: 'Pending', color: 'badge-secondary' },
    validating: { label: 'Validating', color: 'badge-warning' },
    researching: { label: 'Researching', color: 'badge-warning' },
    complete: { label: 'Complete', color: 'badge-success' },
    invalid: { label: 'Invalid', color: 'badge-error' },
  };

  const config = statusConfig[status] || statusConfig.pending;

  return (
    <span className={`badge ${config.color} ${className}`}>
      {config.label}
    </span>
  );
}
