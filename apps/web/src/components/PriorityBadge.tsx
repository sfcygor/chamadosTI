import { Priority, PRIORITY_CONFIG } from '@/lib/types';

interface PriorityBadgeProps {
  priority: Priority;
  showDot?: boolean;
  size?: 'sm' | 'md';
}

export function PriorityBadge({ priority, showDot = true, size = 'md' }: PriorityBadgeProps) {
  const config = PRIORITY_CONFIG[priority];
  const isCritical = priority === 'CRITICA';

  return (
    <span
      className={`badge ${config.bg} ${config.color} border ${config.border} ${
        isCritical ? 'critical-pulse' : ''
      } ${size === 'sm' ? 'text-[10px] px-2 py-0.5' : ''}`}
    >
      {showDot && (
        <span
          className={`status-dot ${config.dot} ${isCritical ? 'animate-pulse' : ''}`}
        />
      )}
      {config.label}
    </span>
  );
}
