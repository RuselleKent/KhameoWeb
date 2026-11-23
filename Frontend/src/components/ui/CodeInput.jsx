import { useRef } from 'react';
import { cn } from '../../lib/utils';

const boxStates = {
  normal: 'border-field bg-white focus:border-brand focus:shadow-[0_0_0_3px_rgba(40,87,85,0.18)]',
  // Figma "Incorrect code": red border on a pale rose fill.
  invalid: 'border-danger-line bg-[#FFF8F7] focus:shadow-[0_0_0_3px_rgba(228,17,5,0.15)]',
  // Figma "Expired code": greyed-out boxes.
  disabled: 'cursor-not-allowed border-divider bg-[#F3F0EA]',
};

/**
 * One-time code boxes (6 by default) with auto-advance, Backspace/arrow navigation and paste.
 *
 * `value` is a string; an empty box is a space, so "12 4" means box 3 is empty.
 * The code is complete when /^\d{6}$/.test(value).
 */
export default function CodeInput({
  value,
  onChange,
  length = 6,
  invalid = false,
  disabled = false,
  autoFocus = false,
  label = 'Verification code',
  'aria-describedby': describedBy,
  className,
  ref,
}) {
  const refs = useRef([]);
  const digits = Array.from({ length }, (_, i) => (value[i] && value[i] !== ' ' ? value[i] : ''));

  const focusAt = (i) => refs.current[Math.max(0, Math.min(length - 1, i))]?.focus();
  const emit = (next) => onChange(next.map((d) => d || ' ').join('').trimEnd());

  // Write `text`'s digits into the boxes starting at `start`, then focus the box after them.
  function fillFrom(start, text) {
    const incoming = text.replace(/\D/g, '').slice(0, length - start);
    if (!incoming) return;
    const next = [...digits];
    [...incoming].forEach((d, k) => {
      next[start + k] = d;
    });
    emit(next);
    focusAt(start + incoming.length);
  }

  function handleChange(i, e) {
    const typed = e.target.value.replace(/\D/g, '');
    if (!typed) {
      const next = [...digits];
      next[i] = '';
      emit(next);
      return;
    }
    // More than one digit arrives from SMS/email autofill or a paste the browser handled itself.
    fillFrom(typed.length >= length ? 0 : i, typed);
  }

  function handleKeyDown(i, e) {
    if (e.key === 'Backspace' && !digits[i] && i > 0) {
      e.preventDefault();
      const next = [...digits];
      next[i - 1] = '';
      emit(next);
      focusAt(i - 1);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      focusAt(i - 1);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      focusAt(i + 1);
    }
  }

  function handlePaste(i, e) {
    e.preventDefault();
    const text = e.clipboardData.getData('text');
    // A full code always fills from the first box, wherever the cursor was.
    fillFrom(text.replace(/\D/g, '').length >= length ? 0 : i, text);
  }

  const state = disabled ? 'disabled' : invalid ? 'invalid' : 'normal';

  return (
    <div ref={ref} role="group" aria-label={label} className={cn('grid gap-2', className)} style={{ gridTemplateColumns: `repeat(${length}, minmax(0, 1fr))` }}>
      {digits.map((digit, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete={i === 0 ? 'one-time-code' : 'off'}
          autoFocus={autoFocus && i === 0}
          aria-label={`Digit ${i + 1} of ${length}`}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          disabled={disabled}
          value={digit}
          onChange={(e) => handleChange(i, e)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={(e) => handlePaste(i, e)}
          onFocus={(e) => e.target.select()}
          className={cn(
            'aspect-square w-full min-w-0 rounded-xl border-[1.5px] text-center text-[26px] leading-[30.5px] font-bold text-ink caret-brand outline-none',
            'transition-[border-color,box-shadow] duration-150',
            boxStates[state],
          )}
        />
      ))}
    </div>
  );
}
