import { Link } from 'react-router-dom';
import { LoaderCircle } from 'lucide-react';
import { cn } from '../../lib/utils';

const base =
  'inline-flex items-center justify-center gap-2 rounded-xl font-semibold whitespace-nowrap ' +
  'transition-colors duration-150 ' +
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ' +
  'disabled:pointer-events-none aria-busy:cursor-wait';

// Disabled styles skip loading buttons (aria-busy) so the spinner stays at full strength.
const fade = 'disabled:not-aria-busy:opacity-50';

const variants = {
  // Figma shows a disabled primary button as flat #BFD2D1, not a faded brand colour.
  primary: 'bg-brand text-white hover:bg-brand-dark disabled:not-aria-busy:bg-brand-disabled',
  secondary: `border border-line bg-white text-brand hover:bg-canvas ${fade}`,
  // Same outline as secondary but with dark text (used by GoogleButton).
  neutral: `border border-line bg-white text-ink hover:bg-canvas ${fade}`,
  ghost: `text-ink hover:bg-ink/5 ${fade}`,
};

const sizes = {
  sm: 'h-9 px-3.5 text-sm',
  md: 'h-11 px-5 text-sm',
  lg: 'h-13 px-6 text-base',
  // Full-width form button from the Figma auth screens: 52px tall, 15px label.
  block: 'h-13 w-full px-4 text-[15px]',
  // Same with the 17px label used on the onboarding steps.
  blockLg: 'h-13 w-full px-[22px] text-[17px]',
};

/**
 * Button
 * - `to`      renders a react-router <Link> (internal routes)
 * - `href`    renders an <a> (anchors / external links)
 * - otherwise renders a <button type="button">
 * - `loading` (buttons only) disables it, shows a spinner and `loadingText` (or the label)
 */
export default function Button({
  variant = 'primary',
  size = 'md',
  to,
  href,
  loading = false,
  loadingText,
  disabled,
  className,
  type = 'button',
  children,
  ...props
}) {
  const classes = cn(base, variants[variant], sizes[size], className);

  if (to) {
    return (
      <Link to={to} className={classes} {...props}>
        {children}
      </Link>
    );
  }

  if (href) {
    return (
      <a href={href} className={classes} {...props}>
        {children}
      </a>
    );
  }

  return (
    <button
      type={type}
      className={classes}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? (
        <>
          <LoaderCircle aria-hidden="true" className="size-[18px] shrink-0 animate-spin" />
          {loadingText ?? children}
        </>
      ) : (
        children
      )}
    </button>
  );
}
