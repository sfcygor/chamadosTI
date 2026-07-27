import { TicketStatus, STATUS_CONFIG } from '@/lib/types';

interface StatusBadgeProps {
  status: TicketStatus;
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];

  return (
    <span
      className={`badge ${config.bg} ${config.color} ${
        size === 'sm' ? 'text-[10px] px-2 py-0.5' : ''
      }`}
    >
      {config.label}
    </span>
  );
}
