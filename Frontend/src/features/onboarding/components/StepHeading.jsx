import { PATHS } from '../paths';

/** Pill (the path's name, or `label`) with an optional `note` beside it, title and one line of text. */
export default function StepHeading({ pathId, label, note, title, description }) {
  return (
    <>
      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
        <p className="w-fit rounded-full bg-brand-soft px-3 py-1.5 text-[13px] leading-[17px] font-semibold text-brand">
          {label ?? PATHS.find((path) => path.id === pathId).title}
        </p>
        {note && <p className="text-[13px] leading-[17px] font-medium text-muted">{note}</p>}
      </div>
      <h1 className="text-[28px] leading-tight text-ink sm:text-[36px]">{title}</h1>
      <p className="text-[15px] leading-5 text-muted">{description}</p>
    </>
  );
}
