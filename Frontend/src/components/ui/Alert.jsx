import { CircleAlert, CircleCheck, Info } from 'lucide-react';
import { cn } from '../../lib/utils';

const VARIANTS = {
  // Matches the Figma "No account found" box: grey fill, soft red border, red title, grey body.
  error: {
    Icon: CircleAlert,
    role: 'alert',
    box: 'border-[#F3B7B1] bg-[#F1F1F1] text-[#3D4B4B]',
    title: 'text-danger',
    icon: 'text-danger',
  },
  // Matches the Figma "You already have an account" box: grey fill, peach border, orange-brown title.
  warning: {
    Icon: CircleAlert,
    role: 'alert',
    box: 'border-[#F6D9B8] bg-[#F4F4F4] text-[#3D4B4B]',
    title: 'text-[#B84A0F]',
    icon: 'text-[#B84A0F]',
  },
  success: {
    Icon: CircleCheck,
    role: 'status',
    box: 'border-brand/25 bg-brand/5 text-brand-dark',
    title: '',
    icon: 'text-brand',
  },
  info: {
    Icon: Info,
    role: 'status',
    box: 'border-divider bg-canvas text-ink',
    title: '',
    icon: 'text-brand',
  },
};

/**
 * Inline message box. variant: 'error' | 'warning' | 'success' | 'info'.
 * - `title`    bold first line
 * - `actions`  optional row of links/buttons under the text
 * - `icon`     set to false to hide the icon (the Figma error box has none)
 * Errors use role="alert" so screen readers announce them right away; the others use role="status".
 */
export default function Alert({
  variant = 'info',
  title,
  actions,
  icon = true,
  className,
  children,
  ...props
}) {
  const v = VARIANTS[variant] ?? VARIANTS.info;
  const { Icon } = v;

  return (
    <div
      role={v.role}
      className={cn('flex gap-3 rounded-xl border px-[17px] py-[15px] text-sm leading-[21px]', v.box, className)}
      {...props}
    >
      {icon && <Icon aria-hidden="true" className={cn('mt-0.5 size-[18px] shrink-0', v.icon)} />}
      <div className="flex min-w-0 flex-col gap-2">
        {title && <p className={cn('font-bold', v.title)}>{title}</p>}
        {children && <div>{children}</div>}
        {actions && <div className="flex flex-wrap items-center gap-x-8 gap-y-2">{actions}</div>}
      </div>
    </div>
  );
}
