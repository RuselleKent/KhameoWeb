import { cn } from '../../lib/utils';

/** Horizontal rule with an optional word in the middle ("or" by default). Pass label={null} for a plain line. */
export default function Divider({ label = 'or', className }) {
  return (
    <div className={cn('flex items-center gap-3 text-sm text-muted', className)}>
      <span aria-hidden="true" className="h-px flex-1 bg-divider" />
      {label && <span>{label}</span>}
      {label && <span aria-hidden="true" className="h-px flex-1 bg-divider" />}
    </div>
  );
}
