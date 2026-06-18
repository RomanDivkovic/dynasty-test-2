import type { ReactNode } from "react";

interface MetricProps {
  label: string;
  value: ReactNode;
  detail?: ReactNode;
}

export function Metric({ label, value, detail }: MetricProps) {
  return (
    <div className="rounded border border-black/10 bg-white/80 p-3">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-1 text-2xl font-black text-ink">{value}</div>
      {detail ? <div className="mt-1 text-xs text-slate-500">{detail}</div> : null}
    </div>
  );
}
