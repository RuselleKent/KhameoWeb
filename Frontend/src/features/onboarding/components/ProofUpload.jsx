import { useState } from 'react';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';
import FieldError from '../../../components/ui/FieldError';
import { cn } from '../../../lib/utils';
import { formatFileSize } from '../../../lib/formatFileSize';
import { HOST_MESSAGES, isValidProof, PROOF_TYPES } from '../hostRules';

const TYPE_LABELS = { 'application/pdf': 'PDF', 'image/jpeg': 'JPG', 'image/png': 'PNG' };

/** Drop zone (`label` is its accessible name) for one file (PDF, PNG or JPG up to 5 MB), then its name with Remove. Nothing is uploaded here. */
export default function ProofUpload({ label, file, onChange, error, disabled }) {
  const [dragging, setDragging] = useState(false);
  const [rejected, setRejected] = useState(false);
  const [confirming, setConfirming] = useState(false);

  function accept(candidate) {
    if (!candidate || disabled) return;
    const valid = isValidProof(candidate);
    setRejected(!valid);
    if (valid) onChange(candidate);
  }

  const message = rejected ? HOST_MESSAGES.proofInvalid : error;

  return (
    <div className="flex flex-col gap-3">
      <label
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          accept(e.dataTransfer.files[0]);
        }}
        className={cn(
          'flex flex-col items-center gap-2 rounded-[14px] border border-dashed p-6 text-center transition-colors',
          'has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent',
          disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer',
          dragging
            ? 'border-brand bg-brand-soft'
            : message
              ? 'border-danger-line bg-white'
              : 'border-line bg-white hover:border-brand',
        )}
      >
        <input
          type="file"
          accept={PROOF_TYPES.join(',')}
          disabled={disabled}
          aria-label={label}
          aria-describedby="proof-hint proof-error"
          className="sr-only"
          onChange={(e) => {
            accept(e.target.files[0]);
            // Allow choosing the same file again after removing it.
            e.target.value = '';
          }}
        />
        <span className="text-[15px] leading-5 font-semibold text-ink">
          {file ? 'Drop another file or choose one' : 'Drop a file or choose one'}
        </span>
        <span id="proof-hint" className="text-[13px] leading-[17px] text-muted">
          PDF, PNG or JPG · up to 5 MB
        </span>
      </label>

      <div role="alert" className="empty:hidden">
        {message && <FieldError id="proof-error">{message}</FieldError>}
      </div>

      {file && (
        <div className="flex items-center gap-3 rounded-xl border border-[#B9D9D2] bg-[#F6FBFA] px-3.5 py-3">
          <span className="shrink-0 rounded-full bg-white px-2.5 py-1 text-xs leading-4 font-semibold text-brand">
            {TYPE_LABELS[file.type]}
          </span>
          <p className="flex min-w-0 flex-1 gap-1 text-sm leading-[18px] font-medium text-ink">
            <span className="truncate">{file.name}</span>
            <span className="shrink-0">· {formatFileSize(file.size)}</span>
          </p>
          <button
            type="button"
            disabled={disabled}
            onClick={() => setConfirming(true)}
            className="shrink-0 rounded text-[13px] font-semibold text-brand underline underline-offset-2 hover:text-brand-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-50"
          >
            Remove
          </button>
        </div>
      )}

      <ConfirmDialog
        open={confirming}
        title="Remove this file?"
        confirmLabel="Remove file"
        onConfirm={() => {
          setConfirming(false);
          onChange(null);
        }}
        onCancel={() => setConfirming(false)}
      >
        You’ll need to choose a file again before you can submit.
      </ConfirmDialog>
    </div>
  );
}
