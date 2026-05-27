import { Copy, Maximize2, Minus, X } from "lucide-react";
import appIcon from "../../../assets/icon.png";

export function TitleBar({ maximized }: { maximized: boolean }) {
  return (
    <div className="titlebar flex h-11 shrink-0 items-center justify-between bg-[var(--color-shell)] pl-4 text-slate-300">
      <div className="titlebar-drag flex min-w-0 flex-1 items-center gap-3">
        <img className="size-6 rounded-md object-contain" src={appIcon} alt="" />
        <span className="text-[13px] font-medium text-slate-200">ETSI Standards Reader</span>
      </div>
      <div className="titlebar-controls flex h-full shrink-0">
        <button aria-label="Minimize" className="window-control" onClick={() => window.etsiWindow?.minimize()}>
          <Minus size={16} />
        </button>
        <button
          aria-label={maximized ? "Restore window" : "Maximize"}
          className="window-control"
          onClick={() => window.etsiWindow?.toggleMaximize()}
        >
          {maximized ? <Copy size={13} /> : <Maximize2 size={14} />}
        </button>
        <button
          aria-label="Close"
          className="window-control window-control-close"
          onClick={() => window.etsiWindow?.close()}
        >
          <X size={17} />
        </button>
      </div>
    </div>
  );
}
