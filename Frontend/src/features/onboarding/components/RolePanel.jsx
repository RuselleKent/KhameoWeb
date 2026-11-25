import { useId, useState } from 'react';
import { Check, ChevronDown, LoaderCircle } from 'lucide-react';
import { getErrorInfo } from '../../../lib/apiErrors';
import { cn } from '../../../lib/utils';
import { MAX_AUDIENCE_NAME, MAX_CHECKED_AUDIENCES } from '../audiences';
import { suggestAudiences } from '../onboarding.api';
import { addOwnAudience, applySuggestions, checkedCount, cleanName, isFull, setAudienceChecked } from '../roles';

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

/** Message under the AI button for a failed call. */
function aiErrorMessage({ status, code, retryAfter }) {
  if (status === 503 && code === 'ai_unavailable') return 'AI suggestions aren’t available right now.';
  if (status === 429) return `You’ve asked for a lot of suggestions. Try again in ${retryAfter ?? 60} seconds.`;
  return 'We couldn’t get suggestions.';
}

/**
 * One added role and its audiences (Figma 59917:38183).
 * - `onChange((role) => nextRole)` always works on the latest role, since suggestions arrive later
 */
export default function RolePanel({ role, open, onToggle, onChange, onRemove }) {
  const id = useId();
  const [loading, setLoading] = useState(false);
  const [aiError, setAiError] = useState(null);
  const [announcement, setAnnouncement] = useState('');

  const count = checkedCount(role);
  const full = isFull(role);
  const hasSuggestions = role.audiences.some((a) => a.source === 'ai');
  // Array.sort is stable: defaults, then AI suggestions, then the user's own, each in the order added.
  const audiences = [...role.audiences].sort((a, b) => SOURCE_ORDER[a.source] - SOURCE_ORDER[b.source]);

  async function suggest() {
    if (loading) return;
    setLoading(true);
    setAiError(null);
    setAnnouncement('');
    try {
      const { audiences: names } = await suggestAudiences({
        role: role.name,
        existing_audiences: role.audiences.map((a) => a.name),
      });
      if (names.length > 0) {
        onChange((current) => applySuggestions(current, names));
        setAnnouncement('New AI suggestions added.');
      } else {
        setAnnouncement('No new suggestions right now.');
      }
    } catch (error) {
      setAiError(aiErrorMessage(getErrorInfo(error)));
    } finally {
      setLoading(false);
    }
  }

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
            <button
              type="button"
              disabled={loading}
              aria-busy={loading || undefined}
              onClick={suggest}
              className={cn(
                'inline-flex min-h-10 items-center gap-2 rounded-[10px] bg-brand px-4 text-sm font-bold text-white transition-colors hover:bg-brand-dark aria-busy:cursor-wait',
                focusRing,
              )}
            >
              {loading ? (
                <>
                  <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
                  Suggesting…
                </>
              ) : (
                <>
                  <span aria-hidden="true">{hasSuggestions ? '↻' : '✦'}</span>
                  {hasSuggestions ? 'Generate again' : 'Suggest more with AI'}
                </>
              )}
            </button>
            <AddAudience full={full} onAdd={(name) => onChange((current) => addOwnAudience(current, name))} />
          </div>

          <div role="alert" className="empty:hidden">
            {aiError && (
              <p className="text-[13px] leading-[18px] text-danger">
                {aiError}{' '}
                <button
                  type="button"
                  onClick={suggest}
                  className={cn('rounded font-bold text-brand underline underline-offset-2 hover:text-brand-dark', focusRing)}
                >
                  Retry
                </button>
              </p>
            )}
          </div>
          <p aria-live="polite" className={announcement.startsWith('No new') ? 'text-[13px] leading-[17px] text-muted' : 'sr-only'}>
            {announcement}
          </p>

          <p className="text-[13px] leading-[17px] text-muted">
            {full && <span className="font-semibold text-ink">You’ve checked {MAX_CHECKED_AUDIENCES}, the most per role. </span>}
            You can check up to {MAX_CHECKED_AUDIENCES} audiences per role. Unchecked suggestions are not saved.
          </p>
        </div>
      </div>
    </section>
  );
}
