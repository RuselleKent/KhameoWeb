import { Check } from 'lucide-react';
import { cn } from '../../../lib/utils';

/**
 * Success screen body: green check badge, heading, text, then `children` (buttons/links).
 * - align="center": 72px badge, centred (Email verified, Password updated)
 * - align="start":  56px badge, left-aligned (Reset link sent)
 */
export default function AuthSuccess({ title, description, align = 'center', children }) {
  const centered = align === 'center';

  return (
    <div className={cn('flex flex-col', centered ? 'items-center gap-[18px] text-center' : 'items-start gap-5')}>
      <span
        aria-hidden="true"
        className={cn(
          'grid shrink-0 place-items-center rounded-full bg-success-soft text-success',
          centered ? 'size-[72px]' : 'size-14',
        )}
      >
        <Check strokeWidth={2.75} className={centered ? 'size-9' : 'size-[26px]'} />
      </span>

      <div className={cn('flex w-full flex-col', centered ? 'gap-2' : 'gap-5')}>
        <h1 className="text-[32px] leading-[1.2] text-ink">{title}</h1>
        {description && <p className="text-sm leading-[21px] text-muted">{description}</p>}
      </div>

      {children && <div className="flex w-full flex-col gap-[18px]">{children}</div>}
    </div>
  );
}
