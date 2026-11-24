import { Link } from 'react-router-dom';
import { Clock, Star, Users } from 'lucide-react';
import logoMark from '../../../assets/logo-mark.png';
import stageImage from '../../../assets/auth-brand-stage.jpg';
import { cn } from '../../../lib/utils';

// Each feature is split into the two lines used in Figma; they still wrap on narrow panels.
const FEATURES = [
  { Icon: Clock, lines: ['Practice at your own pace,', 'any time'] },
  { Icon: Users, lines: ['Rehearse with your team,', 'one speaker at a time'] },
  { Icon: Star, lines: ['Get clear feedback right after', 'you finish'] },
];

// Dark teal base with a mint glow bottom-left (as in Figma) and a faint one under the spotlights.
const PANEL_BACKGROUND = [
  'radial-gradient(ellipse 75% 40% at 0% 100%, rgb(45 189 168 / 0.32), transparent 70%)',
  'radial-gradient(ellipse 60% 35% at 75% 0%, rgb(45 189 168 / 0.14), transparent 70%)',
  'linear-gradient(180deg, var(--color-panel) 0%, #03302e 60%, #054440 100%)',
].join(', ');

function LogoLink({ light = false, className }) {
  return (
    <Link
      to="/"
      className={cn(
        'flex w-fit items-center gap-3 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent',
        className,
      )}
    >
      <img src={logoMark} alt="" width="40" height="40" className="size-10" />
      <span className={cn('text-[22px] font-bold', light ? 'text-white' : 'text-brand')}>Khameo</span>
    </Link>
  );
}

/** Hand-drawn mint underline under "They adapt." */
function Swoosh() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 300 14"
      fill="none"
      preserveAspectRatio="none"
      className="absolute top-full left-[8%] h-[0.18em] w-[78%]"
    >
      <path d="M2 11C60 6 120 4 175 4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" opacity="0.7" />
      <path d="M95 9C160 3 230 2 298 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

function BrandPanel() {
  return (
    <aside
      aria-label="About Khameo"
      className="relative hidden overflow-hidden text-white md:sticky md:top-0 md:flex md:h-dvh md:w-[44%] md:shrink-0 md:self-start lg:w-[53%]"
      style={{ background: PANEL_BACKGROUND }}
    >
      {/* Spotlights, crowd and mic. Faded on tablets so it doesn't fight the text. */}
      <img
        src={stageImage}
        alt=""
        width="300"
        height="848"
        className="absolute inset-y-0 right-3.5 h-full w-auto max-w-none opacity-35 [mask-image:linear-gradient(to_right,transparent,black_40%)] lg:opacity-100 xl:right-[18px]"
      />
      {/* Mint stripe along the panel's right edge */}
      <div aria-hidden="true" className="absolute inset-y-0 right-0 w-3.5 bg-gradient-to-b from-mint-light to-mint xl:w-[18px]" />

      <div className="relative flex w-full flex-col px-8 pt-16 pb-10">
        <LogoLink light />

        <div className="mt-12 lg:pl-4 xl:mt-16 2xl:mt-20 2xl:pl-11">
          <p className="font-display text-[36px] leading-[0.98] lg:text-[48px] xl:text-[60px] 2xl:text-[72px]">
            Great speakers
            <br />
            don’t blend in.
            <br />
            <span className="relative inline-block text-mint">
              They adapt.
              <Swoosh />
            </span>
          </p>

          <p className="mt-8 text-base leading-[1.45] text-white/90 lg:text-lg 2xl:mt-10 2xl:text-[22px]">
            <span className="block">Practice speaking at your own pace,</span>{' '}
            <span className="block">or rehearse together with your team.</span>
          </p>

          <ul className="mt-8 flex flex-col gap-4 2xl:mt-11 2xl:gap-[18px]">
            {FEATURES.map(({ Icon, lines }) => (
              <li key={lines[0]} className="flex items-center gap-4 2xl:gap-6">
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[#055b54] shadow-[0_0_18px_rgb(45_189_168/0.45)] ring-2 ring-mint/50 lg:size-12 2xl:size-[60px]">
                  <Icon aria-hidden="true" strokeWidth={2.25} className="size-5 lg:size-6 2xl:size-7" />
                </span>
                <span className="text-sm leading-snug text-white/90 lg:text-base 2xl:text-[19px]">
                  <span className="block">{lines[0]}</span> <span className="block">{lines[1]}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </aside>
  );
}

/**
 * Split layout for the auth screens: dark teal brand panel on the left, white form panel on the right.
 * Under 768px the brand panel is hidden and the logo sits above the form.
 * Children render in a centered 420px column (the form width in Figma).
 */
export default function AuthLayout({ children }) {
  return (
    <div className="flex min-h-dvh bg-white">
      <BrandPanel />

      <main className="flex min-h-dvh flex-1 flex-col items-center justify-start bg-white px-4 py-10 sm:px-6 md:justify-center md:px-10 lg:px-16">
        <div className="w-full max-w-[420px]">
          <LogoLink className="mb-10 md:hidden" />
          {children}
        </div>
      </main>
    </div>
  );
}
