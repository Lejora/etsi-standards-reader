import { BookOpenText, ChevronDown, FileText, FolderClosed, MoreVertical, Plus, Search, Upload } from "lucide-react";
import { PanelHeader } from "./PanelHeader";
import type { OutlineItem } from "./types";

function bytesLabel(size: number) {
  return `${(size / (1024 * 1024)).toFixed(2)} MB`;
}

interface LibraryPanelProps {
  folderName: string;
  documents: ManagedDocument[];
  activeDocument: ManagedDocument | null;
  outline: OutlineItem[];
  pageNumber: number;
  searchQuery: string;
  onSearchQueryChange(query: string): void;
  onImport(): void;
  onOpenDocument(document: ManagedDocument): void;
  onSelectPage(page: number): void;
}

export function LibraryPanel({
  folderName,
  documents,
  activeDocument,
  outline,
  pageNumber,
  searchQuery,
  onSearchQueryChange,
  onImport,
  onOpenDocument,
  onSelectPage,
}: LibraryPanelProps) {
  return (
    <aside className="workspace-panel flex min-h-0 flex-col overflow-hidden border-r border-slate-200 bg-white">
      <PanelHeader icon={<BookOpenText size={15} />} title="Reading" />

      <div className="px-4 pt-3">
        <label className="flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-slate-400 shadow-sm">
          <Search size={15} />
          <input
            className="min-w-0 flex-1 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
            placeholder="Search ETSI PDFs"
            value={searchQuery}
            onChange={(event) => onSearchQueryChange(event.target.value)}
          />
        </label>
      </div>

      <div className="flex items-center justify-between px-4 pb-3 pt-5 text-xs font-medium text-slate-500">
        <span className="truncate" title={folderName}>
          {folderName}
        </span>
        <button aria-label="Import PDF" onClick={onImport}>
          <Plus size={16} className="text-slate-600" />
        </button>
      </div>

      <div className="scroll-pane min-h-0 flex-1 overflow-y-scroll px-3 pb-4">
        {documents.map((document) => (
          <button
            className={`group mb-0.5 flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm transition ${
              document.id === activeDocument?.id
                ? "bg-brand-50 font-medium text-brand-700"
                : "text-slate-600 hover:bg-slate-50"
            }`}
            key={document.id}
            title={`${document.fileName} (${bytesLabel(document.byteSize)})`}
            onClick={() => onOpenDocument(document)}
          >
            <FileText size={15} className="shrink-0" />
            <span className="min-w-0 flex-1 truncate">{document.fileName}</span>
            <MoreVertical size={14} className="opacity-0 group-hover:opacity-100" />
          </button>
        ))}

        {!documents.length && (
          <button
            className="mx-2 mt-2 flex w-[calc(100%-1rem)] flex-col items-center gap-2 rounded-xl border border-dashed border-slate-200 px-4 py-7 text-center text-xs text-slate-500 hover:border-brand-500 hover:text-brand-700"
            onClick={onImport}
          >
            <Upload size={18} />
            Import ETSI PDF
          </button>
        )}

        {activeDocument && (
          <>
            <div className="mb-1 mt-4 flex items-center gap-2 rounded-lg px-2 py-2 text-xs font-semibold text-slate-500">
              <ChevronDown size={14} />
              <FolderClosed size={15} />
              CONTENTS
            </div>
            {outline.slice(0, 70).map((item, index) => (
              <button
                className={`flex w-full items-center justify-between gap-3 rounded-md py-1.5 pr-2 text-left text-xs ${
                  item.page === pageNumber ? "text-brand-700" : "text-slate-500 hover:text-slate-800"
                }`}
                key={`${item.title}-${index}`}
                style={{ paddingLeft: `${15 + item.level * 12}px` }}
                onClick={() => onSelectPage(item.page)}
              >
                <span className="truncate">{item.title}</span>
                <span className="text-slate-400">{item.page}</span>
              </button>
            ))}
          </>
        )}
      </div>
    </aside>
  );
}
