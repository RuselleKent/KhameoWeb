import { useEffect, useRef, useState } from 'react';
import { LoaderCircle } from 'lucide-react';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';
import FieldError from '../../../components/ui/FieldError';
import { useAuth } from '../../../hooks/useAuth';
import { getFieldErrors } from '../../../lib/apiErrors';
import { removeAvatar, uploadAvatar } from '../onboarding.api';
import { AVATAR_TYPES, MAX_AVATAR_BYTES, MESSAGES } from '../profileRules';

const pillClass =
  'rounded-full border border-field bg-white px-3.5 py-[9px] text-sm leading-[18px] font-semibold text-ink transition-colors hover:bg-canvas ' +
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-50';

function initialsOf(name) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  return [words[0], words.length > 1 ? words.at(-1) : '']
    .map((word) => word?.[0] ?? '')
    .join('')
    .toUpperCase();
}

/**
 * Profile photo with preview, Upload/Change and Remove. Saves right away (it isn't part of the form).
 * `name` gives the initials shown while there is no photo.
 */
export default function ProfilePhoto({ name }) {
  const { user, setUser } = useAuth();
  const inputRef = useRef(null);
  // Local preview of the file being uploaded.
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState(null);
  const [confirming, setConfirming] = useState(false);
  const [removing, setRemoving] = useState(false);

  const uploading = preview !== null;
  const photo = preview ?? user.avatar_url;

  // Free the preview's memory once it's replaced or the page is left.
  useEffect(() => () => preview && URL.revokeObjectURL(preview), [preview]);

  async function handleFile(e) {
    const file = e.target.files[0];
    // Allow picking the same file again after an error.
    e.target.value = '';
    if (!file) return;

    setError(null);
    if (!AVATAR_TYPES.includes(file.type) || file.size > MAX_AVATAR_BYTES) {
      setError(MESSAGES.avatar);
      return;
    }

    setPreview(URL.createObjectURL(file));
    try {
      const { avatar_url } = await uploadAvatar({ avatar: file });
      setUser((current) => current && { ...current, avatar_url });
    } catch (err) {
      setError(getFieldErrors(err).avatar ?? 'We couldn’t upload your photo. Try again.');
    } finally {
      setPreview(null);
    }
  }

  async function handleRemove() {
    setRemoving(true);
    setError(null);
    try {
      const { avatar_url } = await removeAvatar();
      setUser((current) => current && { ...current, avatar_url });
    } catch {
      setError('We couldn’t remove your photo. Try again.');
    } finally {
      setRemoving(false);
      setConfirming(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-4">
        <span className="relative grid size-20 shrink-0 place-items-center overflow-hidden rounded-full bg-brand-soft">
          {photo ? (
            <img src={photo} alt="Your profile photo" className="size-full object-cover" />
          ) : (
            <span aria-hidden="true" className="text-2xl font-semibold text-brand">
              {initialsOf(name)}
            </span>
          )}
          {uploading && (
            <span role="status" className="absolute inset-0 grid place-items-center bg-ink/40">
              <LoaderCircle aria-hidden="true" className="size-6 animate-spin text-white" />
              <span className="sr-only">Uploading photo</span>
            </span>
          )}
        </span>

        <div className="flex min-w-0 flex-col gap-2">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={pillClass}
              disabled={uploading}
              aria-describedby="photo-hint"
              onClick={() => inputRef.current.click()}
            >
              {photo ? 'Change photo' : 'Upload photo'}
            </button>
            {user.avatar_url && (
              <button type="button" className={pillClass} disabled={uploading} onClick={() => setConfirming(true)}>
                Remove
              </button>
            )}
          </div>
          <p id="photo-hint" className="text-[13px] leading-[17px] text-muted">
            JPG, PNG or WEBP, up to 5 MB.
          </p>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept={AVATAR_TYPES.join(',')}
          aria-label="Profile photo"
          className="hidden"
          onChange={handleFile}
        />
      </div>

      <div role="alert">
        <FieldError>{error}</FieldError>
      </div>

      <ConfirmDialog
        open={confirming}
        title="Remove your photo?"
        confirmLabel="Remove photo"
        loading={removing}
        loadingText="Removing…"
        onConfirm={handleRemove}
        onCancel={() => setConfirming(false)}
      >
        Others will see your initials instead. You can upload a new photo any time.
      </ConfirmDialog>
    </div>
  );
}
