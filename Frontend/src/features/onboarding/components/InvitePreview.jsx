const chipClass = 'rounded-full px-2.5 py-1 text-xs leading-4 font-semibold';

/** Card of the group an invite code belongs to. `host` and `note` are the lines under the chips. */
export default function InvitePreview({ invite, title, badge, host, note }) {
  const { group } = invite;

  return (
    <div className="w-full overflow-hidden rounded-2xl border border-field bg-white">
      {group.cover_url ? (
        <img src={group.cover_url} alt="" className="h-28 w-full object-cover sm:h-[180px]" />
      ) : (
        // Groups without a cover photo.
        <div aria-hidden="true" className="h-28 bg-linear-to-r from-panel to-brand sm:h-[180px]" />
      )}
      <div className="flex flex-col gap-2.5 px-5 pt-4 pb-[18px]">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="min-w-0 text-xl leading-6 break-words text-ink">{title}</h2>
          <span className={`${chipClass} bg-success-soft text-success`}>✓ {badge}</span>
        </div>
        <div className="flex gap-1.5">
          <span className={`${chipClass} bg-[#F0F0EE] text-[#3D4743]`}>
            {group.visibility === 'public' ? 'Public' : 'Private'}
          </span>
          <span className={`${chipClass} bg-[#F0F0EE] text-[#3D4743]`}>
            {group.members_count} {group.members_count === 1 ? 'member' : 'members'}
          </span>
        </div>
        <p className="text-sm leading-[18px] text-muted">{host}</p>
        <p className="rounded-[10px] bg-[#F6FBFA] px-3 py-2.5 text-sm leading-[18px] font-medium text-brand">{note}</p>
      </div>
    </div>
  );
}
