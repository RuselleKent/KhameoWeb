import { LoaderCircle } from 'lucide-react';
import googleLogo from '../../assets/google-logo.svg';
import Button from './Button';

/**
 * "Continue with Google Account" outline button (white, #CFC9BC border, 24px logo, 16px gap).
 * Pass `href` for a redirect-based OAuth link, or `onClick` for a handler.
 * `loading` swaps the logo for a spinner and disables the button.
 */
export default function GoogleButton({
  loading = false,
  disabled,
  children = 'Continue with Google Account',
  ...props
}) {
  return (
    <Button
      variant="neutral"
      size="block"
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      <span className="flex items-center gap-4">
        {loading ? (
          <LoaderCircle aria-hidden="true" className="size-6 animate-spin text-muted" />
        ) : (
          <img src={googleLogo} alt="" width="24" height="24" className="size-6" />
        )}
        {children}
      </span>
    </Button>
  );
}
