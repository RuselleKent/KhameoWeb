import { Link } from 'react-router-dom';
import shieldIcon from '../../../assets/icon-shield.svg';
import AuthLayout from './AuthLayout';

/** Frame of the two-factor screens (Figma 1.6): back link, shield badge, title, text, then children. */
export default function TwoFactorScreen({ backTo, backState, backLabel = 'Back', title, description, children }) {
  return (
    <AuthLayout>
      <title>Two-factor · Khameo</title>

      <div className="flex flex-col gap-5">
        <Link
          to={backTo}
          state={backState}
          className="w-fit rounded text-[13px] leading-[1.5] font-semibold text-brand hover:text-brand-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          ← {backLabel}
        </Link>

        <span className="grid size-[52px] place-items-center rounded-full bg-[#E2EEEA]">
          <img src={shieldIcon} alt="" width="24" height="24" />
        </span>

        <h1 className="text-[32px] leading-[1.2] text-ink">{title}</h1>
        <p className="text-sm leading-[21px] text-muted">{description}</p>

        {children}
      </div>
    </AuthLayout>
  );
}
