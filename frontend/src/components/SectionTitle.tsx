export function SectionTitle({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 my-5">
      <h2 className="m-0 text-lg font-semibold tracking-[-0.18px]">{title}</h2>
      {action ? <div className="text-sm font-medium text-[var(--brand)]">{action}</div> : null}
    </div>
  );
}
