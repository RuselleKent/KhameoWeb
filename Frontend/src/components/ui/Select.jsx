import { useId } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../lib/utils';
import FieldError from './FieldError';

/** Dropdown styled like Input. Children are <option>s; give the empty one value="". */
export default function Select({ id, label, hint, error, className, children, value, ...props }) {
  const autoId = useId();
  const selectId = id ?? autoId;
  const hintId = hint ? `${selectId}-hint` : undefined;
  const errorId = error ? `${selectId}-error` : undefined;

  return (
    <div className={cn('flex flex-col', className)}>
      <label htmlFor={selectId} className="mb-1.5 text-sm font-semibold text-ink">
        {label}
      </label>
      <div className="relative">
        <select
          id={selectId}
          value={value}
          aria-invalid={error ? true : undefined}
          aria-describedby={cn(hintId, errorId) || undefined}
          className={cn(
            'h-[54px] w-full cursor-pointer appearance-none rounded-xl border bg-white pr-11 pl-4 text-base outline-none',
            'transition-[border-color,box-shadow] duration-150',
            'focus:border-brand focus:shadow-[0_0_0_3px_rgba(40,87,85,0.18)]',
            'disabled:cursor-not-allowed disabled:bg-canvas disabled:text-muted',
            value ? 'text-ink' : 'text-muted',
            error ? 'border-danger-line' : value ? 'border-field-filled' : 'border-field',
          )}
          {...props}
        >
          {children}
        </select>
        <ChevronDown
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 right-4 size-5 -translate-y-1/2 text-muted"
        />
      </div>

      <FieldError id={errorId} className="mt-2">
        {error}
      </FieldError>
      {hint && (
        <p id={hintId} className="mt-1.5 text-xs text-muted">
          {hint}
        </p>
      )}
    </div>
  );
}
