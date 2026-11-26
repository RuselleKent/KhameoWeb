import lockIcon from '../../../assets/icon-lock.svg';
import Button from '../../../components/ui/Button';
import { formatDuration, useCountdown } from '../../../lib/useCountdown';

/**
 * Account locked screen (Figma 1.7), shown by the login page.
 * - `retryAfter` (seconds, from a 429 after 5 failed tries): counts down to when log in opens again
 * - without it (403 "This account can’t log in"): log in is paused for this account
 * Reset password goes to /forgot-password with the email; Back to log in calls `onBack`.
 */
export default function AccountLocked({ email, retryAfter, onBack }) {
  const [secondsLeft] = useCountdown(retryAfter ?? 0);

  let body;
  if (!retryAfter) {
    body = 'We’ve paused sign-in for this account to protect it. Reset your password now, or try again later.';
  } else if (secondsLeft > 0) {
    body = `After 5 failed attempts we pause sign-in to protect your account. Try again in ${formatDuration(
      secondsLeft,
      { padMinutes: true },
    )}, or reset your password now.`;
  } else {
    body = 'You can try again now, or reset your password if you’ve forgotten it.';
  }

  return (
    <div className="flex flex-col items-start gap-5">
      <title>Account locked · Khameo</title>

      <span className="grid size-14 place-items-center rounded-full bg-[#EAEAEA]">
        <img src={lockIcon} alt="" width="26" height="26" />
      </span>
      <h1 className="text-[32px] leading-[1.2] text-ink">Account locked for now</h1>
      {/* aria-live so the countdown reaching zero is announced, not every second. */}
      <p className="text-sm leading-[1.5] text-muted" aria-live={secondsLeft === 0 ? 'polite' : 'off'}>
        {body}
      </p>
      <Button to="/forgot-password" state={{ email }} size="block">
        Reset password
      </Button>
      <Button variant="ghostBrand" size="block" onClick={onBack}>
        Back to log in
      </Button>
    </div>
  );
}
