import { useCallback, useEffect, useState } from 'react';

/**
 * Seconds left until a deadline, updated a few times a second.
 * const [secondsLeft, restart] = useCountdown(60);  restart(30) starts it again; restart(0) stops it.
 */
export function useCountdown(initialSeconds = 0) {
  const [endsAt, setEndsAt] = useState(() => (initialSeconds > 0 ? Date.now() + initialSeconds * 1000 : 0));
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!endsAt) return undefined;
    const id = setInterval(() => {
      const t = Date.now();
      setNow(t);
      if (t >= endsAt) clearInterval(id);
    }, 250);
    return () => clearInterval(id);
  }, [endsAt]);

  const restart = useCallback((seconds) => {
    const t = Date.now();
    setNow(t);
    setEndsAt(seconds > 0 ? t + seconds * 1000 : 0);
  }, []);

  const secondsLeft = endsAt ? Math.max(0, Math.ceil((endsAt - now) / 1000)) : 0;
  return [secondsLeft, restart];
}

/** 102 → "1:42"; with padMinutes → "01:42" (Figma uses "09:42" for code expiry, "0:42" for resend). */
export function formatDuration(totalSeconds, { padMinutes = false } = {}) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = String(totalSeconds % 60).padStart(2, '0');
  return `${padMinutes ? String(minutes).padStart(2, '0') : minutes}:${seconds}`;
}
