import { cn } from '../../../lib/utils';

/** "Step 1 of 4" with one bar per step. */
export default function StepProgress({ step, total }) {
  return (
    <div className="flex items-center gap-3.5">
      <p className="text-[13px] whitespace-nowrap text-muted">
        Step {step} of {total}
      </p>
      <div aria-hidden="true" className="flex gap-1">
        {Array.from({ length: total }, (_, i) => (
          <span key={i} className={cn('h-[5px] w-5 rounded-[3px] sm:w-8', i < step ? 'bg-brand' : 'bg-divider')} />
        ))}
      </div>
    </div>
  );
}
