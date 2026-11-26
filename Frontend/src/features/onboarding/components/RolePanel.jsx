import { useId, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { MAX_AUDIENCE_NAME, MAX_CHECKED_AUDIENCES } from '../audiences';
import { addOwnAudience, checkedCount, cleanName, isFull, setAudienceChecked } from '../roles';

const SOURCE_ORDER = { default: 0, ai: 1, own: 2 };

const focusRing = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent';

function AudienceOption({ audience, disabled, onChange }) {
  return (
    <label
      className={cn(
        'flex min-h-11 items-center gap-2.5 rounded-[10px] border px-3 py-2 text-sm leading-[18px] text-ink transition-colors',
        'has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent',
        audience.checked ? 'border-brand bg-[#E3F3F1] font-semibold' : 'border-field bg-white',
        disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:border-brand',
      )}
    >
      <span className="relative grid size-[18px] shrink-0 place-items-center">
        <input
          type="checkbox"
          checked={audience.checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
          className="peer size-[18px] cursor-[inherit] appearance-none rounded-[5px] border border-line bg-white outline-none checked:border-brand checked:bg-brand"
        />
        <Check
          aria-hidden="true"
          strokeWidth={3.5}
          className="pointer-events-none absolute size-3 text-white opacity-0 peer-checked:opacity-100"
        />
      </span>
      <span className="min-w-0 break-words">{audience.name}</span>
      {audience.source === 'ai' && (
        <span className="ml-auto shrink-0 text-xs text-brand">
          <span aria-hidden="true">✦</span>
          <span className="sr-only">AI suggestion</span>
        </span>
      )}
    </label>
  );
}

function AddAudience({ full, onAdd }) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const cleaned = cleanName(name, MAX_AUDIENCE_NAME);

  function add() {
    if (!cleaned || full) return;
    onAdd(cleaned);
    setName('');
  }

  if (!open) {
    return (
      <button
        type="button"
        disabled={full}
        onClick={() => setOpen(true)}
        className={cn(
          'min-h-10 rounded-[20px] border border-dashed border-field bg-white px-3.5 text-[13px] font-semibold text-ink transition-colors hover:border-brand',
          'disabled:cursor-not-allowed disabled:opacity-50',
          focusRing,
        )}
      >
        + Add your own audience
      </button>
    );
  }

  return (
    <div className="w-full">
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold text-ink">
        Your own audience
      </label>
      <div className="flex gap-2.5">
        <input
          id={id}
          autoFocus
          value={name}
          maxLength={MAX_AUDIENCE_NAME}
          placeholder="Panel chair"
          disabled={full}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            // Enter adds it instead of submitting the profile form.
            if (e.key === 'Enter') {
              e.preventDefault();
              add();
            }
          }}
          className="h-[46px] min-w-0 flex-1 rounded-[10px] border border-field bg-white px-3 text-[15px] text-ink outline-none placeholder:text-ink/40 focus:border-brand focus:shadow-[0_0_0_3px_rgba(40,87,85,0.18)] disabled:cursor-not-allowed disabled:bg-canvas"
        />
        <button
          type="button"
          disabled={!cleaned || full}
          onClick={add}
          className={cn(
            'h-[46px] shrink-0 rounded-[10px] bg-brand px-4 text-sm font-bold text-white transition-colors hover:bg-brand-dark disabled:bg-brand-disabled',
            focusRing,
          )}
        >
          Add
        </button>
      </div>
    </div>
  );
}

/**
 * "✦ Suggest more with AI", shown but not working yet (no API call). aria-disabled instead of disabled,
 * so it can still be focused and its "coming soon" tooltip shows on hover and on keyboard focus.
 */
function AiSuggestSoon() {
  const tipId = useId();
  return (
    <span className="group relative inline-flex">
      <button
        type="button"
        aria-disabled="true"
        aria-describedby={tipId}
        onClick={(e) => e.preventDefault()}
        className={cn(
          'inline-flex min-h-10 cursor-not-allowed items-center gap-2 rounded-[10px] bg-brand-disabled px-4 text-sm font-bold text-white',
          focusRing,
        )}
      >
        <span aria-hidden="true">✦</span>
        Suggest more with AI
        <span className="rounded-full bg-white px-2 py-0.5 text-[11px] leading-4 font-bold text-brand">Soon</span>
      </button>
      <span
        id={tipId}
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-0 z-10 mb-2 w-max max-w-[240px] rounded-lg bg-ink px-2.5 py-1.5 text-xs leading-4 text-white opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100"
      >
        AI suggestions are coming soon
      </span>
    </span>
  );
}

/**
 * One added role and its audiences (Figma 59917:38183).
 * - `onChange((role) => nextRole)` always works on the latest role
 */
export default function RolePanel({ role, open, onToggle, onChange, onRemove }) {
  const id = useId();
  const count = checkedCount(role);
  const full = isFull(role);
  // Array.sort is stable: defaults, then AI suggestions, then the user's own, each in the order added.
  const audiences = [...role.audiences].sort((a, b) => SOURCE_ORDER[a.source] - SOURCE_ORDER[b.source]);

  return (
    <section aria-labelledby={`${id}-name`} className="rounded-xl border border-field bg-[#FAF9F6] p-4 sm:p-5">
      <div className="flex items-center gap-3">
        <h3 id={`${id}-name`} className="min-w-0 flex-1 font-sans">
          <button
            type="button"
            aria-expanded={open}
            aria-controls={`${id}-body`}
            onClick={onToggle}
            className={cn('flex w-full items-center gap-2 rounded text-left', focusRing)}
          >
            <span className="min-w-0 text-[15px] leading-5 font-semibold break-words text-ink">{role.name}</span>
            <ChevronDown
              aria-hidden="true"
              className={cn('size-4 shrink-0 text-muted transition-transform', open && 'rotate-180')}
            />
          </button>
        </h3>
        <span className="shrink-0 rounded-[3px] bg-[#E3F3F1] px-2.5 py-[3px] text-xs leading-4 font-semibold text-brand">
          {count} of {MAX_CHECKED_AUDIENCES} selected
        </span>
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove role ${role.name}`}
          className={cn(
            'shrink-0 rounded text-[13px] font-semibold text-brand underline underline-offset-2 hover:text-brand-dark',
            focusRing,
          )}
        >
          Remove
        </button>
      </div>

      <div id={`${id}-body`} hidden={!open} className="mt-3.5">
        <div className="flex flex-col gap-3.5">
          <p className="text-[13px] leading-[17px] text-muted">Who do you usually present to? Check the ones that fit you.</p>

          <div role="group" aria-label={`Audiences for ${role.name}`} className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {audiences.map((audience) => (
              <AudienceOption
                key={audience.name}
                audience={audience}
                disabled={full && !audience.checked}
                onChange={(checked) => onChange((current) => setAudienceChecked(current, audience.name, checked))}
              />
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <AiSuggestSoon />
            <AddAudience full={full} onAdd={(name) => onChange((current) => addOwnAudience(current, name))} />
          </div>

          <p className="text-[13px] leading-[17px] text-muted">
            {full && <span className="font-semibold text-ink">You’ve checked {MAX_CHECKED_AUDIENCES}, the most per role. </span>}
            You can check up to {MAX_CHECKED_AUDIENCES} audiences per role. Only checked audiences are saved.
          </p>
        </div>
      </div>
    </section>
  );
}
