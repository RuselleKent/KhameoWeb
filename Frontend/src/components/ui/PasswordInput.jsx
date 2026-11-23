import { useId, useState } from 'react';
import { cn } from '../../lib/utils';
import Input from './Input';

const SEGMENTS = 4;

// How many of the 4 bars fill, and in which colour, for each level (Figma: weak = 1 orange,
// strong = 3 green; fair sits between). 'none' shows the empty bars, e.g. before typing.
const LEVELS = {
  none: { filled: 0, color: '', label: '' },
  weak: { filled: 1, color: 'bg-accent', label: 'Weak' },
  fair: { filled: 2, color: 'bg-caution', label: 'Fair' },
  strong: { filled: 3, color: 'bg-success', label: 'Strong' },
};

function StrengthMeter({ strength, label }) {
  const level = LEVELS[strength];
  if (!level) return null;

  return (
    <div className="mt-1.5">
      <div aria-hidden="true" className="flex gap-1">
        {Array.from({ length: SEGMENTS }, (_, i) => (
          <span
            key={i}
            className={cn(
              'h-[5px] flex-1 rounded-[3px] transition-colors duration-200',
              i < level.filled ? level.color : 'bg-divider',
            )}
          />
        ))}
      </div>
      <p aria-live="polite" className="mt-1.5 text-xs text-muted">
        {strength !== 'none' && <span className="sr-only">Password strength: </span>}
        {label ?? level.label}
      </p>
    </div>
  );
}

/**
 * Password field with a Show/Hide toggle in the label row.
 *
 * - `strength`      optional: 'none' | 'weak' | 'fair' | 'strong' shows the 4-bar meter under the field.
 * - `strengthLabel` optional text under the bars (e.g. "Too short"); defaults to Weak/Fair/Strong.
 * All other props (label, error, hint, placeholder, value, onChange…) go to Input.
 */
export default function PasswordInput({ id, strength, strengthLabel, ...props }) {
  const [visible, setVisible] = useState(false);
  const autoId = useId();
  const inputId = id ?? autoId;

  const toggle = (
    <button
      type="button"
      onClick={() => setVisible((v) => !v)}
      aria-controls={inputId}
      aria-label={visible ? 'Hide password' : 'Show password'}
      className="rounded text-[13px] font-semibold text-brand hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
    >
      {visible ? 'Hide' : 'Show'}
    </button>
  );

  return (
    <Input
      id={inputId}
      type={visible ? 'text' : 'password'}
      labelAction={toggle}
      autoCapitalize="none"
      autoCorrect="off"
      spellCheck={false}
      {...props}
    >
      {strength && <StrengthMeter strength={strength} label={strengthLabel} />}
    </Input>
  );
}
