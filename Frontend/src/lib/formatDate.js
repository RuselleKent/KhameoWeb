const day = new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
const time = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' });

/** ISO time → "Fri, Dec 4 · 7:30 PM" in the user's own time zone. */
export function formatEventTime(iso) {
  const date = new Date(iso);
  return `${day.format(date)} · ${time.format(date)}`;
}

const fullDay = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

/** ISO time → "Nov 24, 2026". */
export function formatDay(iso) {
  return fullDay.format(new Date(iso));
}
