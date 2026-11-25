import { cn } from '../../../lib/utils';

/** "Step 1 of 4" with one bar per step, and an optional Skip action (children). */
export default function StepProgress({ step, total, children }) {
  return (
    <div className="flex items-center gap-2 sm:gap-3.5">
      <p className="text-[13px] whitespace-nowrap text-muted">
        Step {step} of {total}
      </p>
      <div aria-hidden="true" className="flex gap-1">
        {Array.from({ length: total }, (_, i) => (
          <span key={i} className={cn('h-[5px] w-3 rounded-[3px] sm:w-8', i < step ? 'bg-brand' : 'bg-divider')} />
        ))}
      </div>
      {children}
    </div>
  );
}
