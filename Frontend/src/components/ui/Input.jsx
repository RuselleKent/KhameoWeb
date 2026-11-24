import { useId } from 'react';
import { cn } from '../../lib/utils';
import FieldError from './FieldError';

const fieldBase =
  'w-full rounded-xl border p-4 text-base leading-5 text-ink outline-none ' +
  'placeholder:text-ink/40 transition-[border-color,box-shadow] duration-150 ' +
  'disabled:cursor-not-allowed disabled:bg-canvas disabled:text-muted';

const fieldStates = {
  // Empty: light border. Has a value: dark teal border. Focused: brand border + soft ring.
  // Each state sets its own background so the error grey never fights bg-white.
  normal:
    'border-field bg-white not-placeholder-shown:border-field-filled ' +
    'focus:border-brand focus:shadow-[0_0_0_3px_rgba(40,87,85,0.18)]',
  // Figma error state: grey fill, red border.
  error: 'border-danger-line bg-[#F3F3F3] focus:shadow-[0_0_0_3px_rgba(228,17,5,0.15)]',
  // Figma "confirmed" state (e.g. the email on the wrong-password screen): green border.
  success: 'border-success bg-white focus:shadow-[0_0_0_3px_rgba(30,123,69,0.18)]',
};

/**
 * Text input with a label, optional hint, and an error message under the field.
 *
 * - `labelAction` renders on the right of the label row (PasswordInput puts "Show" there).
 * - `children` render under the field and its error, above the hint (used for the strength meter).
 * - Passing `error` sets aria-invalid and links the message with aria-describedby.
 * - `success` shows the green "confirmed" border (ignored while there is an error).
 * - `prefix` is one fixed character shown inside the field, e.g. "@" for usernames.
 */
export default function Input({
  id,
  label,
  labelAction,
  hint,
  error,
  success = false,
  prefix,
  placeholder,
  className,
  inputClassName,
  children,
  ref,
  'aria-describedby': describedBy,
  ...props
}) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const hintId = hint ? `${inputId}-hint` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;

  return (
    <div className={cn('flex flex-col', className)}>
      {(label || labelAction) && (
        <div className="mb-1.5 flex items-center justify-between gap-3">
          <label htmlFor={inputId} className="text-sm font-semibold text-ink">
            {label}
          </label>
          {labelAction}
        </div>
      )}

      <div className="relative">
        <input
          ref={ref}
          id={inputId}
          // A blank placeholder keeps :placeholder-shown working, which drives the "filled" border.
          placeholder={placeholder ?? ' '}
          aria-invalid={error ? true : undefined}
          aria-describedby={cn(describedBy, hintId, errorId) || undefined}
          className={cn(
            'peer',
            fieldBase,
            fieldStates[error ? 'error' : success ? 'success' : 'normal'],
            prefix && 'pl-[31px]',
            inputClassName,
          )}
          {...props}
        />
        {prefix && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute top-[17px] left-[17px] text-base leading-5 text-ink peer-placeholder-shown:text-ink/40"
          >
            {prefix}
          </span>
        )}
      </div>

      <FieldError id={errorId} className="mt-2">
        {error}
      </FieldError>

      {children}
      {hint && (
        <p id={hintId} className={cn('text-xs text-muted', error ? 'mt-2' : 'mt-1.5')}>
          {hint}
        </p>
      )}
    </div>
  );
}
