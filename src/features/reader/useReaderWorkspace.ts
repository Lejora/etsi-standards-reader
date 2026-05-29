import { useCallback, useEffect, useMemo, useRef, useState, type WheelEvent } from "react";
import {
  GlobalWorkerOptions,
  getDocument,
  type PDFDocumentProxy,
  type PDFPageProxy,
} from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.mjs?url";
import { buildReadingBlocks, extractLines, resolveContentsRange, resolveOutline } from "./pdfReading";
import type {
  ContentsRange,
  IndexedPage,
  OutlineItem,
  PageDirection,
  ReadingBlock,
  SearchFilters,
  SearchHit,
  SidePanel,
  ToastMessage,
  ViewMode,
} from "./types";

GlobalWorkerOptions.workerSrc = pdfWorker;

export function useReaderWorkspace() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const readingScrollRef = useRef<HTMLDivElement>(null);
  const boundaryDeltaRef = useRef(0);
  const transitionTimeoutRef = useRef<number | undefined>(undefined);
  const readingPositionRef = useRef(new Map<number, number>());
  const pendingTurnRef = useRef<{ page: number; position: "top" | "bottom" } | null>(null);
  const viewModeRef = useRef<ViewMode>("reading");
  const [documents, setDocuments] = useState<ManagedDocument[]>([]);
  const [folders, setFolders] = useState<LibraryFolder[]>([]);
  const [activeDocument, setActiveDocument] = useState<ManagedDocument | null>(null);
  const [pdf, setPdf] = useState<PDFDocumentProxy | null>(null);
  const [outline, setOutline] = useState<OutlineItem[]>([]);
  const [contentsRange, setContentsRange] = useState<ContentsRange | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [viewMode, setViewMode] = useState<ViewMode>("reading");
  const [sidePanel, setSidePanel] = useState<SidePanel>("search");
  const [zoom, setZoom] = useState(100);
  const [normativeHighlight, setNormativeHighlight] = useState(false);
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    mode: "contains",
    matchCase: false,
    wholeWord: false,
    pageFrom: "",
    pageTo: "",
  });
  const [readingBlocks, setReadingBlocks] = useState<ReadingBlock[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [indexedPages, setIndexedPages] = useState<IndexedPage[]>([]);
  const [indexStatus, setIndexStatus] = useState("Not indexed");
  const [storageLocation, setStorageLocation] = useState("");
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [pageTransition, setPageTransition] = useState<PageDirection | null>(null);
  const [boundaryProgress, setBoundaryProgress] = useState(0);
  const [boundaryDirection, setBoundaryDirection] = useState<PageDirection>("next");
  const [windowMaximized, setWindowMaximized] = useState(false);

  function updateViewZoom(nextZoom: number) {
    setZoom(Math.min(180, Math.max(50, Math.round(nextZoom / 10) * 10)));
  }

  const dismissToast = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  function pushToast(message: string, tone: ToastMessage["tone"] = "success") {
    const id = Date.now() + Math.random();
    setToasts((current) => [...current, { id, message, tone }]);
  }

  useEffect(() => {
    viewModeRef.current = viewMode;
  }, [viewMode]);

  useEffect(() => {
    if (!window.etsiLibrary) return;
    void window.etsiLibrary.listDocuments().then(setDocuments);
    void window.etsiLibrary.listFolders().then(setFolders);
    void window.etsiLibrary.getLocation().then(setStorageLocation);
  }, []);

  useEffect(() => {
    if (!window.etsiWindow) return;
    void window.etsiWindow.isMaximized().then(setWindowMaximized);
    return window.etsiWindow.onMaximizedChanged(setWindowMaximized);
  }, []);

  async function openDocument(document: ManagedDocument) {
    if (!window.etsiLibrary) return;
    const bytes = await window.etsiLibrary.readPdf(document.id);
    const loadedPdf = await getDocument({ data: bytes }).promise;
    const resolvedOutline = await resolveOutline(loadedPdf);
    setActiveDocument(document);
    setPdf(loadedPdf);
    setPageNumber(1);
    setIndexedPages([]);
    setIndexStatus("Not indexed");
    setOutline(resolvedOutline);
    setContentsRange(await resolveContentsRange(loadedPdf, resolvedOutline));
  }

  function clearDocument() {
    setActiveDocument(null);
    setPdf(null);
    setOutline([]);
    setContentsRange(null);
    setPageNumber(1);
    setReadingBlocks([]);
    setIndexedPages([]);
    setIndexStatus("Not indexed");
  }

  async function importDocuments(folderId?: string, openAfterImport = true) {
    if (!window.etsiLibrary) return;
    try {
      const results = await window.etsiLibrary.importPdfs(folderId);
      if (!results.length) return;
      setDocuments(await window.etsiLibrary.listDocuments());
      const first = results[0];
      pushToast(first.duplicate ? "The existing PDF was placed in this folder." : "PDF copied to managed storage.");
      if (openAfterImport) await openDocument(first.document);
    } catch {
      pushToast("Unable to import the PDF.", "error");
    }
  }

  async function importDroppedDocuments(files: File[], folderId: string) {
    if (!window.etsiLibrary) return;
    try {
      const results = await window.etsiLibrary.importDroppedPdfs(files, folderId);
      if (!results.length) {
        pushToast("Only PDF files can be imported.", "error");
        return;
      }
      setDocuments(await window.etsiLibrary.listDocuments());
      const importedCount = results.filter((result) => !result.duplicate).length;
      const movedCount = results.length - importedCount;
      const messages = [
        importedCount > 0 ? `${importedCount} PDF file(s) imported.` : "",
        movedCount > 0 ? `${movedCount} existing PDF file(s) placed in this folder.` : "",
      ].filter(Boolean);
      pushToast(messages.join(" "));
    } catch {
      pushToast("Unable to import the dropped PDF file(s).", "error");
    }
  }

  async function createFolder(name: string) {
    if (!window.etsiLibrary) throw new Error("Library API is unavailable.");
    const folder = await window.etsiLibrary.createFolder(name);
    setFolders(await window.etsiLibrary.listFolders());
    pushToast(`Folder "${folder.name}" created.`);
    return folder;
  }

  async function moveDocument(documentId: string, folderId: string) {
    if (!window.etsiLibrary) return;
    try {
      const updatedDocument = await window.etsiLibrary.moveDocument(documentId, folderId);
      setDocuments(await window.etsiLibrary.listDocuments());
      setActiveDocument((current) => (current?.id === updatedDocument.id ? updatedDocument : current));
      const folder = folders.find((candidate) => candidate.id === folderId);
      pushToast(`"${updatedDocument.fileName}" moved to ${folder?.name ?? "the folder"}.`);
    } catch {
      pushToast("Unable to move the document.", "error");
    }
  }

  async function downloadDocument(documentId = activeDocument?.id) {
    if (!window.etsiLibrary || !documentId) return;
    try {
      const result = await window.etsiLibrary.downloadPdf(documentId);
      pushToast(`Downloaded "${result.fileName}" to Downloads.`);
    } catch {
      pushToast("Unable to download the original PDF.", "error");
    }
  }

  async function deleteDocument(documentId: string) {
    if (!window.etsiLibrary) return;
    try {
      const updatedDocuments = await window.etsiLibrary.deleteDocument(documentId);
      setDocuments(updatedDocuments);
      if (activeDocument?.id === documentId) {
        clearDocument();
      }
      pushToast("Document removed from the library.");
    } catch {
      pushToast("Unable to remove the document.", "error");
    }
  }

  async function revealDocument(documentId: string) {
    if (!window.etsiLibrary) return;
    try {
      await window.etsiLibrary.revealDocument(documentId);
    } catch {
      pushToast("Unable to show the stored PDF.", "error");
    }
  }

  const isContentsPage =
    Boolean(contentsRange) &&
    pageNumber >= (contentsRange?.start ?? 0) &&
    pageNumber <= (contentsRange?.end ?? -1);
  const firstOutlinePage = outline.length ? Math.min(...outline.map((item) => item.page)) : null;
  const frontMatterBoundary =
    contentsRange?.start ?? (firstOutlinePage && firstOutlinePage > 1 ? firstOutlinePage : null);
  const isFrontMatterPage = Boolean(frontMatterBoundary && pageNumber < frontMatterBoundary);

  useEffect(() => {
    if (!pdf) return;
    if (isContentsPage || isFrontMatterPage) {
      setReadingBlocks([]);
      return;
    }
    let ignored = false;
    void pdf.getPage(pageNumber).then(async (page) => {
      const lines = await extractLines(page);
      const pageOutline = outline.filter((item) => item.page === pageNumber);
      const pageTitle =
        pageOutline[0]?.title ??
        [...outline].reverse().find((item) => item.page <= pageNumber)?.title ??
        `Page ${pageNumber}`;
      if (!ignored) setReadingBlocks(buildReadingBlocks(lines, pageOutline, pageTitle));
    });
    return () => {
      ignored = true;
    };
  }, [isContentsPage, isFrontMatterPage, outline, pageNumber, pdf]);

  useEffect(() => {
    if (viewMode !== "reading") return;
    const container = readingScrollRef.current;
    if (!container) return;
    requestAnimationFrame(() => {
      const pendingTurn = pendingTurnRef.current;
      if (pendingTurn?.page === pageNumber) {
        container.scrollTop = pendingTurn.position === "top" ? 0 : container.scrollHeight;
        pendingTurnRef.current = null;
        return;
      }
      container.scrollTop = readingPositionRef.current.get(pageNumber) ?? 0;
    });
  }, [pageNumber, readingBlocks, viewMode]);

  useEffect(() => {
    return () => {
      if (transitionTimeoutRef.current) window.clearTimeout(transitionTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (!pdf || viewMode !== "original" || !canvasRef.current) return;
    let renderTask: ReturnType<PDFPageProxy["render"]> | undefined;
    void pdf.getPage(pageNumber).then((page) => {
      const viewport = page.getViewport({ scale: 1.35 * (zoom / 100) });
      const canvas = canvasRef.current;
      const context = canvas?.getContext("2d");
      if (!canvas || !context) return;
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      renderTask = page.render({ canvas, canvasContext: context, viewport });
      return renderTask.promise;
    });
    return () => renderTask?.cancel();
  }, [pageNumber, pdf, viewMode, zoom]);

  useEffect(() => {
    if (!pdf) return;
    void buildIndex();
  }, [pdf]);

  async function buildIndex() {
    if (!pdf) return;
    const extracted: IndexedPage[] = [];
    for (let page = 1; page <= pdf.numPages; page += 1) {
      const lines = await extractLines(await pdf.getPage(page));
      extracted.push({ page, text: lines.map((line) => line.text).join("\n") });
      if (page % 10 === 0 || page === pdf.numPages) setIndexStatus(`Indexing text ${page} / ${pdf.numPages}`);
    }
    setIndexedPages(extracted);
    setIndexStatus(`${pdf.numPages} pages indexed`);
  }

  const hits = useMemo<SearchHit[]>(() => {
    const rawQuery = searchQuery.trim();
    if (!rawQuery) return [];

    const pageFrom = Number.parseInt(searchFilters.pageFrom, 10);
    const pageTo = Number.parseInt(searchFilters.pageTo, 10);
    const minPage = Number.isFinite(pageFrom) ? pageFrom : 1;
    const maxPage = Number.isFinite(pageTo) ? pageTo : Number.POSITIVE_INFINITY;
    const query = searchFilters.matchCase ? rawQuery : rawQuery.toLowerCase();
    const queryTerms = query.split(/\s+/).filter(Boolean);
    const boundary = searchFilters.wholeWord ? "\\b" : "";

    function countMatches(text: string, term: string) {
      if (!term) return 0;
      const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const flags = searchFilters.matchCase ? "g" : "gi";
      const pattern = new RegExp(`${boundary}${escaped}${boundary}`, flags);
      return text.match(pattern)?.length ?? 0;
    }

    function matchesText(text: string) {
      const comparable = searchFilters.matchCase ? text : text.toLowerCase();
      if (searchFilters.mode === "all") {
        return queryTerms.every((term) => countMatches(comparable, term) > 0);
      }
      return countMatches(comparable, query) > 0;
    }

    function matchCount(text: string) {
      const comparable = searchFilters.matchCase ? text : text.toLowerCase();
      if (searchFilters.mode === "all") {
        return queryTerms.reduce((total, term) => total + countMatches(comparable, term), 0);
      }
      return countMatches(comparable, query);
    }

    if (!query) return [];
    return indexedPages.flatMap(({ page, text }) => {
      if (page < minPage || page > maxPage) return [];
      const plain = text.replace(/\s+/g, " ");
      if (!matchesText(plain)) return [];
      const comparable = searchFilters.matchCase ? plain : plain.toLowerCase();
      const position =
        searchFilters.mode === "all"
          ? Math.min(
              ...queryTerms
                .map((term) => comparable.indexOf(term))
                .filter((candidate) => candidate >= 0),
            )
          : comparable.indexOf(query);
      const start = Math.max(0, position - 65);
      return [
        {
          page,
          matchCount: matchCount(plain),
          snippet: plain.slice(start, position + rawQuery.length + 90),
        },
      ];
    });
  }, [indexedPages, searchFilters, searchQuery]);

  const pageOutline = outline.filter((item) => item.page === pageNumber);
  const sectionTitle =
    (isFrontMatterPage
      ? pageNumber === 1
        ? "Cover page"
        : "Front matter"
      : isContentsPage
        ? "Contents"
        : pageOutline[0]?.title) ??
    [...outline].reverse().find((item) => item.page <= pageNumber)?.title ??
    "Document page";
  const nextReadingPage = isContentsPage && contentsRange ? contentsRange.end + 1 : pageNumber + 1;

  async function copyCitation() {
    if (!activeDocument || !window.etsiClipboard) return;

    const citation = `${activeDocument.fileName} | Page ${pageNumber} | ${sectionTitle}`;
    try {
      await window.etsiClipboard.writeText(citation);
      pushToast("Citation copied to clipboard.");
    } catch {
      pushToast("Unable to copy the citation.", "error");
    }
  }

  async function copyDocumentCitation(document: ManagedDocument) {
    if (!window.etsiClipboard) return;
    const importedAt = new Date(document.importedAt).toLocaleDateString();
    const citation = `${document.fileName} | Managed PDF | Imported ${importedAt}`;
    try {
      await window.etsiClipboard.writeText(citation);
      pushToast("Citation copied to clipboard.");
    } catch {
      pushToast("Unable to copy the citation.", "error");
    }
  }

  function resetBoundaryProgress() {
    boundaryDeltaRef.current = 0;
    setBoundaryProgress(0);
  }

  function changeReadingPage(direction: PageDirection) {
    if (!pdf || pageTransition) return;
    let target = direction === "next" ? pageNumber + 1 : pageNumber - 1;
    if (contentsRange) {
      if (isContentsPage && direction === "next") target = contentsRange.end + 1;
      if (pageNumber === contentsRange.end + 1 && direction === "previous") target = contentsRange.start;
    }
    if (target < 1 || target > pdf.numPages) return;
    setPageTransition(direction);
    resetBoundaryProgress();
    transitionTimeoutRef.current = window.setTimeout(() => {
      pendingTurnRef.current = { page: target, position: direction === "next" ? "top" : "bottom" };
      setPageNumber(target);
      requestAnimationFrame(() => setPageTransition(null));
    }, 170);
  }

  function selectViewMode(nextMode: ViewMode) {
    const container = readingScrollRef.current;
    if (viewModeRef.current === "reading" && container) {
      readingPositionRef.current.set(pageNumber, container.scrollTop);
    }
    viewModeRef.current = nextMode;
    setViewMode(nextMode);
  }

  function handleReaderScroll() {
    if (viewModeRef.current !== "reading" || pageTransition) return;
    const container = readingScrollRef.current;
    if (container) readingPositionRef.current.set(pageNumber, container.scrollTop);
  }

  function handleReadingWheel(event: WheelEvent<HTMLDivElement>) {
    if (event.ctrlKey) {
      event.preventDefault();
      updateViewZoom(zoom + (event.deltaY < 0 ? 10 : -10));
      return;
    }

    if (viewMode !== "reading" || !pdf || pageTransition) return;
    const container = event.currentTarget;
    const atBottom = container.scrollTop + container.clientHeight >= container.scrollHeight - 2;
    const atTop = container.scrollTop <= 2;
    const movingNext = event.deltaY > 0 && atBottom && pageNumber < pdf.numPages;
    const movingPrevious = event.deltaY < 0 && atTop && pageNumber > 1;
    if (!movingNext && !movingPrevious) {
      if (!atBottom && !atTop) resetBoundaryProgress();
      return;
    }
    event.preventDefault();
    const direction: PageDirection = movingNext ? "next" : "previous";
    const sameDirection =
      (boundaryDeltaRef.current >= 0 && direction === "next") ||
      (boundaryDeltaRef.current <= 0 && direction === "previous");
    const delta = Math.min(Math.abs(event.deltaY), 48);
    boundaryDeltaRef.current = sameDirection
      ? boundaryDeltaRef.current + (direction === "next" ? delta : -delta)
      : direction === "next"
        ? delta
        : -delta;
    const progress = Math.min(100, (Math.abs(boundaryDeltaRef.current) / 150) * 100);
    setBoundaryDirection(direction);
    setBoundaryProgress(progress);
    if (progress >= 100) changeReadingPage(direction);
  }

  function openSearchHit(page: number) {
    setPageNumber(page);
    selectViewMode("reading");
  }

  return {
    activeDocument,
    boundaryDirection,
    boundaryProgress,
    canvasRef,
    documents,
    folders,
    hasIndex: indexedPages.length > 0,
    hits,
    indexStatus,
    isContentsPage,
    isFrontMatterPage,
    nextReadingPage,
    normativeHighlight,
    outline,
    pageNumber,
    pageTransition,
    pdf,
    readingBlocks,
    readingScrollRef,
    searchQuery,
    searchFilters,
    sectionTitle,
    sidePanel,
    storageLocation,
    viewMode,
    windowMaximized,
    zoom,
    toasts,
    dismissToast,
    downloadDocument,
    deleteDocument,
    revealDocument,
    copyCitation,
    copyDocumentCitation,
    handleReaderScroll,
    handleReadingWheel,
    createFolder,
    clearDocument,
    importDocuments,
    importDroppedDocuments,
    moveDocument,
    openDocument,
    openSearchHit,
    selectViewMode,
    setPageNumber,
    setSearchQuery,
    setSearchFilters,
    setSidePanel,
    setNormativeHighlight,
    setZoom: updateViewZoom,
  };
}
