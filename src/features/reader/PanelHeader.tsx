import type { ReactNode } from "react";

export function PanelHeader({ icon, title }: { icon: ReactNode; title: string }) {
  return (
    <div className="flex h-11 shrink-0 items-center gap-2 border-b border-slate-100 px-4">
      <span className="text-brand-600">{icon}</span>
      <span className="text-xs font-semibold text-slate-700">{title}</span>
    </div>
  );
}
