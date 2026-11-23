import { cn } from '../../lib/utils';

/** Red error line with the round "!" badge, as in the Figma error states. */
export default function FieldError({ id, className, children }) {
  if (!children) return null;

  return (
    <p id={id} className={cn('flex items-start gap-1.5 text-[13px] leading-[18px] text-danger', className)}>
      <span
        aria-hidden="true"
        className="mt-px grid size-4 shrink-0 place-items-center rounded-full bg-danger text-[11px] leading-none font-bold text-white"
      >
        !
      </span>
      <span>{children}</span>
    </p>
  );
}
