import { Palette, Settings } from "lucide-react";
import { PanelHeader } from "./PanelHeader";
import type { ColorTheme } from "./types";

const themeOptions: Array<{
  value: ColorTheme;
  label: string;
  description: string;
  swatches: string[];
}> = [
  {
    value: "forest",
    label: "Forest",
    description: "Deep green accents with a calm reading workspace.",
    swatches: ["#087568", "#0f8b7d", "#d9f0ea"],
  },
  {
    value: "ocean",
    label: "Ocean",
    description: "Clear blue accents for a cooler workspace tone.",
    swatches: ["#2563b8", "#3182d4", "#dbeafe"],
  },
];

export function SettingsPanel({
  colorTheme,
  onColorThemeChange,
}: {
  colorTheme: ColorTheme;
  onColorThemeChange(theme: ColorTheme): void;
}) {
  const selected = themeOptions.find((option) => option.value === colorTheme) ?? themeOptions[0];

  return (
    <aside className="flex min-h-0 flex-col overflow-hidden border-r border-slate-200 bg-white">
      <PanelHeader icon={<Settings size={15} />} title="Settings" />
      <div className="scroll-pane min-h-0 flex-1 overflow-y-auto px-4 py-5">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
          <Palette size={15} className="text-brand-600" />
          Appearance
        </div>
        <label className="mt-5 block text-[11px] font-medium uppercase tracking-wider text-slate-400">
          Color theme
          <select
            className="mt-2 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm normal-case tracking-normal text-slate-700 outline-none focus:border-brand-500"
            value={colorTheme}
            onChange={(event) => onColorThemeChange(event.target.value as ColorTheme)}
          >
            {themeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <div className="mt-5 rounded-xl border border-slate-200 p-4">
          <p className="text-sm font-semibold text-slate-800">{selected.label}</p>
          <p className="mt-2 text-xs leading-5 text-slate-500">{selected.description}</p>
          <div className="mt-4 flex gap-2" aria-label={`${selected.label} color preview`}>
            {selected.swatches.map((swatch) => (
              <span
                className="size-8 rounded-lg border border-black/5"
                key={swatch}
                style={{ backgroundColor: swatch }}
              />
            ))}
          </div>
        </div>
        <p className="mt-4 text-xs leading-5 text-slate-400">
          Reading page colors remain available separately from the document toolbar.
        </p>
      </div>
    </aside>
  );
}
