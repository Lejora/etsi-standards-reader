import { BookOpenText, Home, Search, Settings } from "lucide-react";
import type { ReactNode } from "react";
import type { AppMode } from "../../features/reader/types";

function RailButton({
  icon,
  label,
  onClick,
  selected = false,
}: {
  icon: ReactNode;
  label: string;
  onClick(): void;
  selected?: boolean;
}) {
  return (
    <button
      aria-label={label}
      className={`grid size-10 place-items-center rounded-xl transition ${
        selected
          ? "bg-brand-600 text-white shadow-lg shadow-brand-700/25"
          : "text-slate-400 hover:bg-white/10 hover:text-white"
      }`}
      onClick={onClick}
      title={label}
    >
      {icon}
    </button>
  );
}

export function AppRail({
  activeMode,
  onModeChange,
}: {
  activeMode: AppMode;
  onModeChange(mode: AppMode): void;
}) {
  return (
    <aside className="flex min-h-0 w-[68px] shrink-0 flex-col items-center overflow-y-auto bg-[var(--color-shell)] py-5">
      <nav className="flex flex-col gap-3" aria-label="Primary navigation">
        <RailButton
          icon={<Home size={19} />}
          label="Home"
          onClick={() => onModeChange("home")}
          selected={activeMode === "home"}
        />
        <RailButton
          icon={<BookOpenText size={19} />}
          label="Reading"
          onClick={() => onModeChange("reader")}
          selected={activeMode === "reader"}
        />
        <RailButton
          icon={<Search size={19} />}
          label="Search"
          onClick={() => onModeChange("search")}
          selected={activeMode === "search"}
        />
        <RailButton
          icon={<Settings size={19} />}
          label="Settings"
          onClick={() => onModeChange("settings")}
          selected={activeMode === "settings"}
        />
      </nav>
    </aside>
  );
}
