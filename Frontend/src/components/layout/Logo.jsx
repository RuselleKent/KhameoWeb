import logoMark from '../../assets/logo-mark.png';
import { cn } from '../../lib/utils';

/** Khameo mark and wordmark. `light` is for dark backgrounds. */
export default function Logo({ light = false, className }) {
  return (
    <span className={cn('flex w-fit items-center gap-3', className)}>
      <img src={logoMark} alt="" width="40" height="40" className="size-10" />
      <span className={cn('text-[22px] font-bold', light ? 'text-white' : 'text-brand')}>Khameo</span>
    </span>
  );
}
