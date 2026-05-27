import { useMemo, useState, type DragEvent } from "react";
import { FileText, FolderClosed, FolderPlus, GripVertical, LibraryBig, Plus, Upload } from "lucide-react";

const DOCUMENT_DRAG_TYPE = "application/x-etsi-document-id";

function bytesLabel(size: number) {
  return `${(size / (1024 * 1024)).toFixed(2)} MB`;
}

export function HomeView({
  activeDocument,
  documents,
  folders,
  selectedFolderId,
  onCreateFolder,
  onImport,
  onImportFiles,
  onMoveDocument,
  onOpenDocument,
  onSelectFolder,
}: {
  activeDocument: ManagedDocument | null;
  documents: ManagedDocument[];
  folders: LibraryFolder[];
  selectedFolderId: string;
  onCreateFolder(name: string): Promise<LibraryFolder>;
  onImport(folderId: string): void;
  onImportFiles(files: File[], folderId: string): void;
  onMoveDocument(documentId: string, folderId: string): Promise<void>;
  onOpenDocument(document: ManagedDocument): void;
  onSelectFolder(folderId: string): void;
}) {
  const [newFolderName, setNewFolderName] = useState("");
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [folderError, setFolderError] = useState("");
  const [dragOverFolderId, setDragOverFolderId] = useState<string | null>(null);
  const [isUploadDropTarget, setIsUploadDropTarget] = useState(false);
  const selectedFolder = folders.find((folder) => folder.id === selectedFolderId) ?? folders[0];
  const visibleDocuments = useMemo(
    () => documents.filter((document) => document.folderId === selectedFolder?.id),
    [documents, selectedFolder?.id],
  );

  async function submitFolder() {
    if (!newFolderName.trim()) return;
    setFolderError("");
    try {
      const folder = await onCreateFolder(newFolderName);
      onSelectFolder(folder.id);
      setNewFolderName("");
      setIsCreatingFolder(false);
    } catch (error) {
      setFolderError(error instanceof Error ? error.message : "Folder could not be created.");
    }
  }

  function hasFiles(event: DragEvent) {
    return Array.from(event.dataTransfer.types).includes("Files");
  }

  function beginDocumentDrag(event: DragEvent, documentId: string) {
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData(DOCUMENT_DRAG_TYPE, documentId);
  }

  function allowFolderDrop(event: DragEvent, folderId: string) {
    const isDocumentMove = event.dataTransfer.types.includes(DOCUMENT_DRAG_TYPE);
    if (!isDocumentMove && !hasFiles(event)) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = isDocumentMove ? "move" : "copy";
    setDragOverFolderId(folderId);
  }

  function dropOnFolder(event: DragEvent, folderId: string) {
    event.preventDefault();
    setDragOverFolderId(null);
    const documentId = event.dataTransfer.getData(DOCUMENT_DRAG_TYPE);
    if (documentId) {
      void onMoveDocument(documentId, folderId);
      return;
    }
    const files = Array.from(event.dataTransfer.files);
    if (files.length) onImportFiles(files, folderId);
  }

  function dropFilesInSelectedFolder(event: DragEvent) {
    event.preventDefault();
    setIsUploadDropTarget(false);
    const files = Array.from(event.dataTransfer.files);
    if (files.length) onImportFiles(files, selectedFolder?.id ?? "etsi-documents");
  }

  return (
    <main className="flex min-h-0 flex-1 flex-col overflow-hidden bg-[#f5f7f7]">
      <header className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-white px-8 py-6">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-brand-700">
            <LibraryBig size={18} />
            Library Home
          </div>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">Document folders</h1>
          <p className="mt-1 text-sm text-slate-500">Organize locally managed ETSI specifications.</p>
        </div>
        <button
          className="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-brand-700"
          onClick={() => onImport(selectedFolder?.id ?? "etsi-documents")}
        >
          <Upload size={16} />
          Import PDF
        </button>
      </header>
      <div className="grid min-h-0 flex-1 grid-cols-[280px_minmax(520px,1fr)] gap-6 overflow-hidden p-6">
        <section className="flex min-h-0 flex-col rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Folders</span>
            <button
              aria-label="Create folder"
              className="grid size-8 place-items-center rounded-lg text-slate-500 hover:bg-brand-50 hover:text-brand-700"
              onClick={() => setIsCreatingFolder(true)}
            >
              <FolderPlus size={17} />
            </button>
          </div>
          {isCreatingFolder && (
            <div className="border-b border-slate-100 p-3">
              <input
                autoFocus
                className="h-9 w-full rounded-lg border border-slate-200 px-3 text-sm text-slate-700 outline-none focus:border-brand-500"
                placeholder="Folder name"
                value={newFolderName}
                onChange={(event) => setNewFolderName(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") void submitFolder();
                  if (event.key === "Escape") setIsCreatingFolder(false);
                }}
              />
              {folderError && <p className="mt-2 text-xs text-red-600">{folderError}</p>}
              <div className="mt-3 flex justify-end gap-2">
                <button
                  className="rounded-md px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-50"
                  onClick={() => setIsCreatingFolder(false)}
                >
                  Cancel
                </button>
                <button
                  className="flex items-center gap-1 rounded-md bg-brand-600 px-3 py-1.5 text-xs font-medium text-white"
                  onClick={() => void submitFolder()}
                >
                  <Plus size={13} />
                  Create
                </button>
              </div>
            </div>
          )}
          <div className="scroll-pane min-h-0 flex-1 overflow-y-auto p-3">
            {folders.map((folder) => {
              const count = documents.filter((document) => document.folderId === folder.id).length;
              return (
                <button
                  className={`mb-1 flex w-full items-center gap-3 rounded-lg border px-3 py-3 text-left text-sm transition ${
                    dragOverFolderId === folder.id
                      ? "border-brand-500 bg-brand-50 font-medium text-brand-700"
                      : selectedFolder?.id === folder.id
                        ? "border-transparent bg-brand-50 font-medium text-brand-700"
                        : "border-transparent text-slate-600 hover:bg-slate-50"
                  }`}
                  key={folder.id}
                  onClick={() => onSelectFolder(folder.id)}
                  onDragLeave={() => setDragOverFolderId((current) => (current === folder.id ? null : current))}
                  onDragOver={(event) => allowFolderDrop(event, folder.id)}
                  onDrop={(event) => dropOnFolder(event, folder.id)}
                >
                  <FolderClosed size={17} />
                  <span className="min-w-0 flex-1 truncate">{folder.name}</span>
                  <span className="text-xs text-slate-400">{count}</span>
                </button>
              );
            })}
          </div>
        </section>
        <section className="flex min-h-0 flex-col rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-6 py-5">
            <h2 className="text-lg font-semibold text-slate-900">{selectedFolder?.name ?? "Documents"}</h2>
            <p className="mt-1 text-xs text-slate-500">{visibleDocuments.length} PDF documents</p>
          </div>
          <div
            className={`scroll-pane min-h-0 flex-1 overflow-y-auto p-5 transition ${
              isUploadDropTarget ? "bg-brand-50/40" : ""
            }`}
            onDragLeave={() => setIsUploadDropTarget(false)}
            onDragOver={(event) => {
              if (!hasFiles(event)) return;
              event.preventDefault();
              event.dataTransfer.dropEffect = "copy";
              setIsUploadDropTarget(true);
            }}
            onDrop={dropFilesInSelectedFolder}
          >
            <div
              className={`mb-5 flex items-center justify-center gap-2 rounded-xl border border-dashed px-4 py-4 text-xs transition ${
                isUploadDropTarget
                  ? "border-brand-500 bg-brand-50 text-brand-700"
                  : "border-slate-200 text-slate-400"
              }`}
            >
              <Upload size={16} />
              Drop PDF files to import into {selectedFolder?.name ?? "this folder"}
            </div>
            {visibleDocuments.map((document) => (
              <div
                className={`mb-3 flex cursor-grab items-center gap-4 rounded-xl border p-4 active:cursor-grabbing ${
                  document.id === activeDocument?.id ? "border-brand-100 bg-brand-50/40" : "border-slate-100"
                }`}
                draggable
                key={document.id}
                onDragStart={(event) => beginDocumentDrag(event, document.id)}
              >
                <GripVertical size={15} className="shrink-0 text-slate-300" />
                <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-slate-50 text-brand-700">
                  <FileText size={21} />
                </span>
                <button className="min-w-0 flex-1 text-left" onClick={() => onOpenDocument(document)}>
                  <span className="block truncate text-sm font-medium text-slate-800">{document.fileName}</span>
                  <span className="mt-1 block text-xs text-slate-400">{bytesLabel(document.byteSize)}</span>
                </button>
              </div>
            ))}
            {!visibleDocuments.length && (
              <div className="flex h-full min-h-52 flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 text-center">
                <FolderClosed size={27} className="text-slate-300" />
                <p className="mt-3 text-sm font-medium text-slate-600">No documents in this folder</p>
                <p className="mt-1 text-xs text-slate-400">Move a PDF here or import a new document.</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
