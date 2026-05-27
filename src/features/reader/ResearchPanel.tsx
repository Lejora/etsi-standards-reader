import { Bot, MessageSquareText, Plus, Search, Sparkles } from "lucide-react";
import { IconButton } from "../../components/ui/IconButton";
import type { SearchHit, SidePanel } from "./types";

interface ResearchPanelProps {
  sidePanel: SidePanel;
  searchQuery: string;
  indexStatus: string;
  hits: SearchHit[];
  hasIndex: boolean;
  storageLocation: string;
  onPanelChange(panel: SidePanel): void;
  onSearchQueryChange(query: string): void;
  onOpenHit(page: number): void;
}

export function ResearchPanel({
  sidePanel,
  searchQuery,
  indexStatus,
  hits,
  hasIndex,
  storageLocation,
  onPanelChange,
  onSearchQueryChange,
  onOpenHit,
}: ResearchPanelProps) {
  return (
    <aside className="flex min-h-0 flex-col overflow-hidden border-l border-slate-200 bg-white">
      <div className="flex h-[58px] shrink-0 items-center justify-between border-b border-slate-200 px-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
          <Sparkles size={17} className="text-brand-600" />
          Research
        </div>
        <IconButton label="Research panel">
          <Bot size={17} />
        </IconButton>
      </div>
      <div className="flex gap-1 border-b border-slate-100 px-4 py-3">
        {(["search", "notes"] as SidePanel[]).map((panel) => (
          <button
            className={`flex-1 rounded-md py-2 text-xs font-medium ${
              sidePanel === panel ? "bg-brand-50 text-brand-700" : "text-slate-500"
            }`}
            key={panel}
            onClick={() => onPanelChange(panel)}
          >
            {panel === "search" ? "Search" : "Notes"}
          </button>
        ))}
      </div>
      {sidePanel === "search" ? (
        <>
          <div className="space-y-3 px-4 py-4">
            <label className="flex h-10 items-center gap-2 rounded-lg border border-slate-200 px-3 text-slate-400">
              <Search size={15} />
              <input
                className="min-w-0 flex-1 text-sm text-slate-700 outline-none placeholder:text-slate-400"
                placeholder="Search inside documents"
                value={searchQuery}
                onChange={(event) => onSearchQueryChange(event.target.value)}
              />
            </label>
            <p className="text-[11px] text-slate-400">{indexStatus}</p>
          </div>
          <div className="scroll-pane min-h-0 flex-1 overflow-y-scroll border-t border-slate-100 px-4 py-3">
            {hits.map((hit) => (
              <button
                className="mb-3 w-full rounded-lg border border-slate-100 p-3 text-left transition hover:border-brand-100 hover:bg-brand-50/40"
                key={hit.page}
                onClick={() => onOpenHit(hit.page)}
              >
                <span className="mb-1 block text-xs font-semibold text-brand-700">Page {hit.page}</span>
                <span className="line-clamp-4 block text-xs leading-5 text-slate-600">{hit.snippet}</span>
              </button>
            ))}
            {searchQuery && hasIndex && hits.length === 0 && (
              <p className="pt-5 text-center text-xs text-slate-400">No matching text was found.</p>
            )}
            {!searchQuery && (
              <div className="mt-9 text-center text-slate-400">
                <Search size={21} className="mx-auto mb-3" />
                <p className="text-xs leading-5">Search results appear here.</p>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="scroll-pane flex min-h-0 flex-1 flex-col overflow-y-auto px-4 py-4">
          <div className="rounded-xl border border-slate-200 p-3 text-xs leading-5 text-slate-600">
            <div className="mb-2 flex items-center gap-2 font-semibold text-brand-700">
              <MessageSquareText size={15} />
              Research notes
            </div>
            Notes and highlights linked to original pages will be saved in a later implementation phase.
          </div>
          <button className="mt-3 flex items-center justify-center gap-2 rounded-lg bg-brand-600 py-2.5 text-xs font-medium text-white">
            <Plus size={14} />
            Add note to this page
          </button>
        </div>
      )}
      <div className="border-t border-slate-100 px-4 py-4">
        <p className="text-[10px] font-semibold tracking-widest text-slate-400">MANAGED STORAGE</p>
        <p className="mt-1 truncate text-[11px] text-slate-500" title={storageLocation}>
          {storageLocation || "Available through Electron app storage"}
        </p>
      </div>
    </aside>
  );
}
