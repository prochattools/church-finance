import { cn } from '@/helpers/utils';

export interface AccountBadgeProps {
  label?: string | null;
  identifier?: string | null;
  fallback?: string | null;
  className?: string;
}

export function AccountBadge({ label, identifier, fallback, className }: AccountBadgeProps) {
  const hasLabel = Boolean(label);
  const displayValue = hasLabel ? label ?? fallback ?? '—' : fallback ?? '—';
  const tooltip = hasLabel ? identifier ?? undefined : undefined;

  if (!hasLabel) {
    return (
      <span className={cn('text-xs text-muted-foreground', className)}>
        {displayValue}
      </span>
    );
  }

  return (
    <span
      title={tooltip}
      className={cn(
        'inline-flex max-w-[200px] items-center justify-start rounded-full border px-2.5 py-1 text-xs font-medium',
        hasLabel
          ? 'border-white/15 bg-white/10 text-white/90'
          : 'border-white/5 bg-white/5 text-white/60',
        className,
      )}
    >
      <span className="truncate">{displayValue}</span>
    </span>
  );
}
