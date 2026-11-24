import { useId } from 'react';
import { Check } from 'lucide-react';
import { cn } from '../../lib/utils';
import FieldError from './FieldError';

// Figma uses a 24px Material checkbox (18px box) next to "Keep me signed in",
// and a 16px one (12px box) on the Terms line.
const SIZES = {
  md: { row: 'gap-4 leading-6', slot: 'size-6', box: 'size-[18px]', check: 'size-3.5', errorPad: 'pl-10' },
  sm: { row: 'gap-2 px-1 py-0.5 leading-[21px]', slot: 'h-[21px] w-4', box: 'size-3', check: 'size-2.5', errorPad: 'pl-7' },
};

/**
 * Checkbox with a clickable label. `children` is the label and may contain links
 * (clicking a link follows it without toggling the box).
 * Pass `error` to show a message under it, e.g. for the required 18+ and Terms boxes.
 */
export default function Checkbox({ id, size = 'md', error, className, children, ref, ...props }) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const errorId = error ? `${inputId}-error` : undefined;
  const s = SIZES[size];

  return (
    <div className={className}>
      <label htmlFor={inputId} className={cn('flex items-start text-sm text-ink', s.row)}>
        <span className={cn('relative grid shrink-0 place-items-center', s.slot)}>
          <input
            ref={ref}
            id={inputId}
            type="checkbox"
            aria-invalid={error ? true : undefined}
            aria-describedby={errorId}
            className={cn(
              'peer cursor-pointer appearance-none rounded-[3px] border-2 bg-white transition-colors',
              'checked:border-brand checked:bg-brand',
              'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
              'disabled:cursor-not-allowed disabled:opacity-50',
              error ? 'border-danger' : 'border-ink',
              s.box,
            )}
            {...props}
          />
          <Check
            aria-hidden="true"
            strokeWidth={3.5}
            className={cn('pointer-events-none absolute text-white opacity-0 peer-checked:opacity-100', s.check)}
          />
        </span>
        <span className="min-w-0">{children}</span>
      </label>

      <FieldError id={errorId} className={cn('mt-1', s.errorPad)}>
        {error}
      </FieldError>
    </div>
  );
}
