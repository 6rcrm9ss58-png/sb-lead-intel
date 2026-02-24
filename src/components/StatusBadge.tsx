interface StatusBadgeProps {
  status: 'pending' | 'validating' | 'researching' | 'complete' | 'invalid';
  className?: string;
}

export default function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const statusConfig: Record<string, { label: string; color: string }> = {
    pending: { label: 'Pending', color: 'bg-sb-warning/10 text-sb-warning border-sb-warning/30' },
    validating: { label: 'Validating', color: 'bg-sb-orange/10 text-sb-orange border-sb-orange/30' },
    researching: { label: 'Researching', color: 'bg-sb-orange/10 text-sb-orange border-sb-orange/30' },
    complete: { label: 'Complete', color: 'bg-sb-success/10 text-sb-success border-sb-success/30' },
    invalid: { label: 'Invalid', color: 'bg-sb-error/10 text-sb-error border-sb-error/30' },
  };

  const config = statusConfig[status] || statusConfig.pending;

  return (
    <span className={`inline-flex px-2.5 py-1.5 rounded-full text-xs font-medium border ${config.color} ${className}`}>
      {config.label}
    </span>
  );
}
