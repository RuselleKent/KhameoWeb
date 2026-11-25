import { useEffect, useId, useRef } from 'react';
import Button from './Button';

/**
 * Asks before a crucial action (delete, archive, remove, publish, decline).
 * Uses the native <dialog>: focus stays inside, Esc cancels, and focus returns to the opener.
 */
export default function ConfirmDialog({
  open,
  title,
  children,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  loading = false,
  loadingText,
  onConfirm,
  onCancel,
}) {
  const ref = useRef(null);
  const id = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (open && !dialog.open) dialog.showModal();
    else if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={`${id}-title`}
      aria-describedby={`${id}-body`}
      // Esc: let the parent close it, so `open` stays the single source of truth.
      onCancel={(e) => {
        e.preventDefault();
        if (!loading) onCancel();
      }}
      className="m-auto w-[calc(100%-32px)] max-w-[400px] rounded-card bg-white p-6 text-ink shadow-xl backdrop:bg-ink/40"
    >
      <h2 id={`${id}-title`} className="text-2xl leading-tight">
        {title}
      </h2>
      <div id={`${id}-body`} className="mt-2 text-sm leading-[21px] text-muted">
        {children}
      </div>
      <div className="mt-6 flex justify-end gap-3">
        <Button variant="neutral" disabled={loading} onClick={onCancel}>
          {cancelLabel}
        </Button>
        <Button variant={variant} loading={loading} loadingText={loadingText} onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </div>
    </dialog>
  );
}
