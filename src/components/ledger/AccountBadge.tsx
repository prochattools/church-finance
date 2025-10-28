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
          ? 'border-slate-200 bg-white text-slate-700 dark:border-white/15 dark:bg-white/10 dark:text-white/90'
          : 'border-slate-200 bg-white text-slate-500 dark:border-white/5 dark:bg-white/5 dark:text-white/60',
        className,
      )}
    >
      <span className="truncate">{displayValue}</span>
    </span>
  );
}
