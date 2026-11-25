import { useId } from 'react';
import { Check } from 'lucide-react';
import { cn } from '../../../lib/utils';

/** Selectable card: a radio button with the whole card as its label. `next` shows once selected. */
export default function PathCard({ title, description, next, checked, className, ...inputProps }) {
  const id = useId();

  return (
    <label
      className={cn(
        'relative flex cursor-pointer items-start gap-3.5 rounded-[14px] border px-5 py-[18px] transition-colors',
        'has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent',
        // Figma's selected border is 1.5px; the inset shadow adds the extra half without moving the text.
        checked
          ? 'border-brand bg-brand-soft shadow-[inset_0_0_0_0.5px_var(--color-brand)]'
          : 'border-field bg-white hover:border-brand/50',
        className,
      )}
    >
      <input
        type="radio"
        checked={checked}
        aria-labelledby={`${id}-title`}
        aria-describedby={`${id}-description`}
        className="sr-only"
        {...inputProps}
      />
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span id={`${id}-title`} className="text-base leading-5 font-semibold text-ink">
          {title}
        </span>
        <span id={`${id}-description`} className="flex flex-col gap-1">
          <span className="text-sm leading-[18px] text-muted">{description}</span>
          {checked && next && <span className="text-[13px] leading-[17px] font-medium text-brand">{next}</span>}
        </span>
      </span>
      <span
        aria-hidden="true"
        className={cn(
          'grid size-[22px] shrink-0 place-items-center rounded-full',
          checked ? 'bg-brand text-white' : 'border border-line bg-white',
        )}
      >
        {checked && <Check strokeWidth={3} className="size-3" />}
      </span>
    </label>
  );
}
