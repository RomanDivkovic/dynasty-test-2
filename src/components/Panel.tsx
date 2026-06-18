import type { ReactNode } from "react";

interface PanelProps {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}

export function Panel({ title, action, children }: PanelProps) {
  return (
    <section className="rounded-md border border-black/10 bg-white shadow-panel">
      <header className="flex items-center justify-between gap-3 border-b border-black/10 px-4 py-3">
        <h2 className="text-sm font-black uppercase tracking-wide text-ink">{title}</h2>
        {action}
      </header>
      <div className="p-4">{children}</div>
    </section>
  );
}
