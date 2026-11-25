import { useId, useRef, useState } from 'react';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';
import FieldError from '../../../components/ui/FieldError';
import { cn } from '../../../lib/utils';
import { MAX_ROLE_NAME, MAX_ROLES, PRESET_ROLES } from '../audiences';
import { checkedCount, cleanName, createRole, sameName } from '../roles';
import RolePanel from './RolePanel';

const chipClass =
  'rounded-full border px-4 py-2.5 text-sm leading-[18px] font-semibold transition-colors ' +
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ' +
  'disabled:cursor-not-allowed disabled:opacity-50';
const chipOn = 'border-brand bg-brand text-white hover:bg-brand-dark';
const chipOff = 'border-field bg-white text-ink hover:enabled:border-brand/50';

function CustomRole({ roles, onAdd }) {
  const id = useId();
  const [name, setName] = useState('');
  const [error, setError] = useState(null);
  const cleaned = cleanName(name, MAX_ROLE_NAME);

  function add() {
    if (!cleaned) return;
    if (roles.some((role) => sameName(role.name, cleaned))) {
      setError('You already added this role.');
      return;
    }
    onAdd(cleaned);
  }

  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold text-ink">
        Role name
      </label>
      <div className="flex gap-2.5">
        <input
          id={id}
          autoFocus
          value={name}
          maxLength={MAX_ROLE_NAME}
          placeholder="Real estate agent"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          onChange={(e) => {
            setName(e.target.value);
            setError(null);
          }}
          onKeyDown={(e) => {
            // Enter adds the role instead of submitting the profile form.
            if (e.key === 'Enter') {
              e.preventDefault();
              add();
            }
          }}
          className={cn(
            'h-[46px] min-w-0 flex-1 rounded-[10px] border bg-white px-3 text-[15px] text-ink outline-none placeholder:text-ink/40',
            'focus:shadow-[0_0_0_3px_rgba(40,87,85,0.18)]',
            error ? 'border-danger-line' : 'border-field focus:border-brand',
          )}
        />
        <button
          type="button"
          disabled={!cleaned}
          onClick={add}
          className="h-[46px] shrink-0 rounded-[10px] bg-brand px-4 text-sm font-bold text-white transition-colors hover:bg-brand-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:bg-brand-disabled"
        >
          Add role
        </button>
      </div>
      <FieldError id={`${id}-error`} className="mt-2">
        {error}
      </FieldError>
    </div>
  );
}

/**
 * Optional speaking roles on the profile step, each with the audiences the user presents to.
 * Not group roles (Host, Coach, Member). `onChange((roles) => nextRoles)` works on the latest roles.
 */
export default function RolesSection({ roles, onChange, error }) {
  const sectionRef = useRef(null);
  // Name of the expanded role; one at a time, so five roles stay readable on a phone.
  const [openName, setOpenName] = useState(roles.at(-1)?.name ?? null);
  const [addingCustom, setAddingCustom] = useState(false);
  // Role waiting for "Remove this role?". The name stays while the dialog closes.
  const [removing, setRemoving] = useState(null);
  const [confirming, setConfirming] = useState(false);

  const atLimit = roles.length >= MAX_ROLES;
  const find = (name) => roles.find((role) => sameName(role.name, name));

  function add(name) {
    const role = createRole(name);
    onChange((current) =>
      current.length >= MAX_ROLES || current.some((r) => sameName(r.name, role.name)) ? current : [...current, role],
    );
    setOpenName(role.name);
    setAddingCustom(false);
  }

  function remove(name) {
    onChange((current) => current.filter((role) => !sameName(role.name, name)));
    // Its buttons are gone, so keep keyboard users in this section.
    requestAnimationFrame(() => sectionRef.current?.focus());
  }

  function requestRemove(role) {
    if (checkedCount(role) > 0) {
      setRemoving(role.name);
      setConfirming(true);
    } else {
      remove(role.name);
    }
  }

  function update(name, change) {
    onChange((current) => current.map((role) => (sameName(role.name, name) ? change(role) : role)));
  }

  const removingRole = removing && find(removing);

  return (
    <section
      ref={sectionRef}
      tabIndex={-1}
      aria-labelledby="roles-title"
      className="flex flex-col gap-3.5 rounded-xl outline-none"
    >
      <div className="flex flex-col gap-1">
        <h2 id="roles-title" className="font-sans text-[15px] leading-5 font-semibold text-ink">
          Add a role (optional)
        </h2>
        <p className="text-[13px] leading-[17px] text-muted">
          Your role tells Khameo who you speak as, so feedback fits your goals.
        </p>
      </div>

      <div role="group" aria-labelledby="roles-title" className="flex flex-wrap gap-2">
        {PRESET_ROLES.map((preset) => {
          const role = find(preset);
          return (
            <button
              key={preset}
              type="button"
              aria-pressed={Boolean(role)}
              disabled={!role && atLimit}
              onClick={() => (role ? requestRemove(role) : add(preset))}
              className={cn(chipClass, role ? chipOn : chipOff)}
            >
              {role && <span aria-hidden="true">✓ </span>}
              {preset}
            </button>
          );
        })}
        <button
          type="button"
          aria-expanded={addingCustom}
          disabled={atLimit}
          onClick={() => setAddingCustom((open) => !open)}
          className={cn(chipClass, 'border-dashed', chipOff)}
        >
          + Custom role
        </button>
      </div>

      {addingCustom && !atLimit && <CustomRole roles={roles} onAdd={add} />}

      {atLimit && <p className="text-[13px] leading-[17px] text-muted">You can add up to {MAX_ROLES} roles.</p>}
      <div role="alert" className="empty:hidden">
        <FieldError>{error}</FieldError>
      </div>

      {roles.map((role) => (
        <RolePanel
          key={role.name.toLowerCase()}
          role={role}
          open={openName !== null && sameName(openName, role.name)}
          onToggle={() => setOpenName((current) => (current && sameName(current, role.name) ? null : role.name))}
          onChange={(change) => update(role.name, change)}
          onRemove={() => requestRemove(role)}
        />
      ))}

      <ConfirmDialog
        open={confirming}
        title="Remove this role?"
        confirmLabel="Remove role"
        onConfirm={() => {
          setConfirming(false);
          remove(removing);
        }}
        onCancel={() => setConfirming(false)}
      >
        {removingRole &&
          `${removingRole.name} has ${checkedCount(removingRole)} checked ${
            checkedCount(removingRole) === 1 ? 'audience' : 'audiences'
          }. Removing it clears them.`}
      </ConfirmDialog>
    </section>
  );
}
