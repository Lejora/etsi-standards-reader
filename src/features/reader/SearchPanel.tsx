import { FileSearch, Loader2, Search, SlidersHorizontal } from "lucide-react";
import { PanelHeader } from "./PanelHeader";
import type { SearchFilters, SearchHit } from "./types";

interface SearchPanelProps {
  filters: SearchFilters;
  hasDocument: boolean;
  hasIndex: boolean;
  hits: SearchHit[];
  indexStatus: string;
  searchQuery: string;
  onFilterChange(filters: SearchFilters): void;
  onOpenHit(page: number): void;
  onSearchQueryChange(query: string): void;
}

export function SearchPanel({
  filters,
  hasDocument,
  hasIndex,
  hits,
  indexStatus,
  searchQuery,
  onFilterChange,
  onOpenHit,
  onSearchQueryChange,
}: SearchPanelProps) {
  const canSearch = hasDocument && hasIndex;
  const isIndexing = /\/|\d/.test(indexStatus) && !hasIndex;

  return (
    <aside className="flex min-h-0 flex-col overflow-hidden border-r border-slate-200 bg-white">
      <PanelHeader icon={<FileSearch size={15} />} title="Search" />

      <div className="space-y-4 border-b border-slate-100 px-4 py-3">
        <label className="flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-slate-400 shadow-sm">
          <Search size={15} />
          <input
            className="min-w-0 flex-1 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
            disabled={!canSearch}
            placeholder={canSearch ? "Search terms, commands, clauses..." : "Indexing starts when the PDF opens"}
            value={searchQuery}
            onChange={(event) => onSearchQueryChange(event.target.value)}
          />
        </label>

        {hasDocument && (
          <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2.5 text-xs text-slate-500">
            {isIndexing && <Loader2 size={14} className="animate-spin text-brand-600" />}
            <span>{indexStatus}</span>
          </div>
        )}

        <div className="rounded-xl border border-slate-200 p-3">
          <div className="mb-3 flex items-center gap-2 text-xs font-semibold text-slate-700">
            <SlidersHorizontal size={14} />
            Search options
          </div>
          <div className="grid grid-cols-1 gap-3">
            <label className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
              Mode
              <select
                className="mt-1 h-9 w-full rounded-md border border-slate-200 bg-white px-2 text-xs normal-case tracking-normal text-slate-700 outline-none"
                value={filters.mode}
                onChange={(event) => onFilterChange({ ...filters, mode: event.target.value as SearchFilters["mode"] })}
              >
                <option value="contains">Contains phrase</option>
                <option value="all">All words</option>
                <option value="phrase">Exact phrase</option>
              </select>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <label className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
                From page
                <input
                  className="mt-1 h-9 w-full rounded-md border border-slate-200 px-2 text-xs normal-case tracking-normal text-slate-700 outline-none"
                  inputMode="numeric"
                  placeholder="Any"
                  value={filters.pageFrom}
                  onChange={(event) => onFilterChange({ ...filters, pageFrom: event.target.value })}
                />
              </label>
              <label className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
                To page
                <input
                  className="mt-1 h-9 w-full rounded-md border border-slate-200 px-2 text-xs normal-case tracking-normal text-slate-700 outline-none"
                  inputMode="numeric"
                  placeholder="Any"
                  value={filters.pageTo}
                  onChange={(event) => onFilterChange({ ...filters, pageTo: event.target.value })}
                />
              </label>
            </div>
            <label className="flex items-center gap-2 text-xs text-slate-600">
              <input
                checked={filters.matchCase}
                className="accent-brand-600"
                type="checkbox"
                onChange={(event) => onFilterChange({ ...filters, matchCase: event.target.checked })}
              />
              Match case
            </label>
            <label className="flex items-center gap-2 text-xs text-slate-600">
              <input
                checked={filters.wholeWord}
                className="accent-brand-600"
                type="checkbox"
                onChange={(event) => onFilterChange({ ...filters, wholeWord: event.target.checked })}
              />
              Whole word
            </label>
          </div>
        </div>
      </div>

      <div className="scroll-pane min-h-0 flex-1 overflow-y-scroll px-4 py-4">
        <div className="mb-3 flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-600">Results</span>
          <span className="text-slate-400">{hits.length} pages</span>
        </div>
        {hits.map((hit) => (
          <button
            className="mb-3 w-full rounded-xl border border-slate-100 p-3 text-left transition hover:border-brand-100 hover:bg-brand-50/40"
            key={`${hit.page}-${hit.snippet}`}
            onClick={() => onOpenHit(hit.page)}
          >
            <span className="mb-1 flex items-center justify-between text-xs font-semibold text-brand-700">
              <span>Page {hit.page}</span>
              <span>{hit.matchCount} matches</span>
            </span>
            <span className="line-clamp-4 block text-xs leading-5 text-slate-600">{hit.snippet}</span>
          </button>
        ))}
        {searchQuery && canSearch && hits.length === 0 && (
          <p className="pt-8 text-center text-xs text-slate-400">No matching text was found.</p>
        )}
        {!searchQuery && (
          <div className="mt-10 text-center text-slate-400">
            <Search size={22} className="mx-auto mb-3" />
            <p className="text-xs leading-5">Enter a query to search extracted PDF text.</p>
          </div>
        )}
      </div>
    </aside>
  );
}
