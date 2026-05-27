import { ArrowLeft, ChevronRight } from "lucide-react";

export function WorkspaceHeader({
  activeDocument,
  folderName,
  onBackHome,
  storageLocation,
}: {
  activeDocument: ManagedDocument | null;
  folderName: string;
  onBackHome(): void;
  storageLocation: string;
}) {
  return (
    <header className="flex h-[54px] shrink-0 items-center justify-between gap-4 border-b border-slate-200 bg-white px-5">
      <div className="flex min-w-0 items-center gap-3">
        <button
          aria-label="Back to Home"
          className="grid size-8 shrink-0 place-items-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-800"
          onClick={onBackHome}
        >
          <ArrowLeft size={16} />
        </button>
        <div className="flex min-w-0 items-center gap-2 text-sm text-slate-500">
          <span className="shrink-0">{folderName}</span>
          {activeDocument && (
            <>
              <ChevronRight size={14} className="shrink-0" />
              <span className="truncate font-semibold text-slate-900">{activeDocument.fileName}</span>
            </>
          )}
        </div>
      </div>
      <div className="min-w-0 shrink text-right">
        <p className="text-[10px] font-semibold tracking-widest text-slate-400">MANAGED STORAGE</p>
        <p className="max-w-[320px] truncate text-[11px] text-slate-500" title={storageLocation}>
          {storageLocation || "Electron app storage"}
        </p>
      </div>
    </header>
  );
}
