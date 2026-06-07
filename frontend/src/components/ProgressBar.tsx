interface Props {
  pct: number;
  checked: number;
  total: number;
  found: number;
  label: string;
}

export function ProgressBar({ pct, checked, total, found, label }: Props) {
  return (
    <div className="prog-wrap">
      <div className="prog-top">
        <span className="prog-label">{label}</span>
        <span className="prog-pct">{pct}%</span>
      </div>
      <div className="prog-track">
        <div className="prog-fill" style={{ width: `${pct}%` }} />
      </div>
      <div className="prog-stats">
        <span>{checked.toLocaleString()} / {total.toLocaleString()} checked</span>
        {found > 0 && <span className="prog-found">✓ {found} match{found !== 1 ? "es" : ""} found</span>}
      </div>
    </div>
  );
}