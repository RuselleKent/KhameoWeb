import { PATHS } from '../paths';

/** Path pill, title and one line of text at the top of a step. */
export default function StepHeading({ pathId, title, description }) {
  return (
    <>
      <p className="w-fit rounded-full bg-brand-soft px-3 py-1.5 text-[13px] leading-[17px] font-semibold text-brand">
        {PATHS.find((path) => path.id === pathId).title}
      </p>
      <h1 className="text-[28px] leading-tight text-ink sm:text-[36px]">{title}</h1>
      <p className="text-[15px] leading-5 text-muted">{description}</p>
    </>
  );
}
