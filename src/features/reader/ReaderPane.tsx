import {
  BookOpenText,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Check,
  Copy,
  Download,
  Highlighter,
  MoreVertical,
  PanelLeftClose,
  PanelLeftOpen,
  Upload,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type RefObject,
  type UIEventHandler,
  type WheelEventHandler,
} from "react";
import type { PDFDocumentProxy, PDFPageProxy } from "pdfjs-dist";
import { IconButton } from "../../components/ui/IconButton";
import { HighlightedText } from "./HighlightedText";
import type { OutlineItem, PageDirection, ReadingBlock, SearchFilters, ViewMode } from "./types";

interface ReaderPaneProps {
  pdf: PDFDocumentProxy | null;
  viewMode: ViewMode;
  pageNumber: number;
  zoom: number;
  sectionTitle: string;
  isContentsPage: boolean;
  isFrontMatterPage: boolean;
  outline: OutlineItem[];
  readingBlocks: ReadingBlock[];
  searchQuery: string;
  searchFilters: SearchFilters;
  sidePanelOpen: boolean;
  nextReadingPage: number;
  normativeHighlight: boolean;
  pageTransition: PageDirection | null;
  boundaryProgress: number;
  boundaryDirection: PageDirection;
  canvasRef: RefObject<HTMLCanvasElement | null>;
  readingScrollRef: RefObject<HTMLDivElement | null>;
  onImport(): void;
  onDownload(): void;
  onCopyCitation(): void;
  onViewModeChange(mode: ViewMode): void;
  onPageChange(page: number): void;
  onToggleDocumentPanel(): void;
  onZoomChange(zoom: number): void;
  onNormativeHighlightChange(enabled: boolean): void;
  onScroll: UIEventHandler<HTMLDivElement>;
  onWheel: WheelEventHandler<HTMLDivElement>;
}

export function ReaderPane({
  pdf,
  viewMode,
  pageNumber,
  zoom,
  sectionTitle,
  isContentsPage,
  isFrontMatterPage,
  outline,
  readingBlocks,
  searchQuery,
  searchFilters,
  sidePanelOpen,
  nextReadingPage,
  normativeHighlight,
  pageTransition,
  boundaryProgress,
  boundaryDirection,
  canvasRef,
  readingScrollRef,
  onImport,
  onDownload,
  onCopyCitation,
  onViewModeChange,
  onPageChange,
  onToggleDocumentPanel,
  onZoomChange,
  onNormativeHighlightChange,
  onScroll,
  onWheel,
}: ReaderPaneProps) {
  const [actionsMenuOpen, setActionsMenuOpen] = useState(false);

  return (
    <main className="reader-pane flex min-h-0 min-w-0 flex-col overflow-hidden bg-[#f4f7f7]">
      <div className="relative flex h-[58px] shrink-0 items-center justify-between gap-3 border-b border-slate-200 bg-white px-5">
        <div className="flex shrink-0 items-center gap-3">
          <IconButton
            label={sidePanelOpen ? "Hide document panel" : "Show document panel"}
            onClick={onToggleDocumentPanel}
          >
            {sidePanelOpen ? <PanelLeftClose size={17} /> : <PanelLeftOpen size={17} />}
          </IconButton>
        </div>
        <div className="flex items-center gap-1">
          <div className="mr-3 flex rounded-lg border border-slate-200 bg-slate-50 p-0.5">
            {(["reading", "original"] as ViewMode[]).map((mode) => (
              <button
                className={`rounded-md px-3 py-1.5 text-xs font-medium ${
                  viewMode === mode ? "bg-white text-brand-700 shadow-sm" : "text-slate-500"
                }`}
                key={mode}
                onClick={() => onViewModeChange(mode)}
              >
                {mode === "reading" ? "Reading" : "Original"}
              </button>
            ))}
          </div>
          <span className="mr-2 text-xs font-medium text-slate-600">
            {pdf ? `${pageNumber} / ${pdf.numPages}` : "- / -"}
          </span>
          <IconButton label="Previous page" disabled={pageNumber <= 1} onClick={() => onPageChange(pageNumber - 1)}>
            <ChevronLeft size={16} />
          </IconButton>
          <IconButton
            label="Next page"
            disabled={!pdf || pageNumber >= pdf.numPages}
            onClick={() => onPageChange(pageNumber + 1)}
          >
            <ChevronRight size={16} />
          </IconButton>
          <span className="mx-1 h-5 w-px bg-slate-200" />
          <IconButton label="Zoom out" onClick={() => onZoomChange(Math.max(60, zoom - 10))}>
            <ZoomOut size={16} />
          </IconButton>
          <span className="w-12 text-center text-xs font-medium text-slate-700">{zoom}%</span>
          <IconButton label="Zoom in" onClick={() => onZoomChange(Math.min(160, zoom + 10))}>
            <ZoomIn size={16} />
          </IconButton>
          <IconButton label="Copy citation" disabled={!pdf} onClick={onCopyCitation}>
            <Copy size={16} />
          </IconButton>
          <IconButton label="Download original PDF" disabled={!pdf} onClick={onDownload}>
            <Download size={16} />
          </IconButton>
          <div className="relative">
            <IconButton
              active={actionsMenuOpen}
              label="More actions"
              onClick={() => setActionsMenuOpen((current) => !current)}
            >
              <MoreVertical size={16} />
            </IconButton>
            {actionsMenuOpen && (
              <div className="absolute right-0 top-10 z-40 w-64 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 text-sm shadow-xl">
                <button
                  className="flex w-full items-center gap-3 px-3 py-2 text-left text-slate-600 hover:bg-slate-50"
                  onClick={() => {
                    onNormativeHighlightChange(!normativeHighlight);
                    setActionsMenuOpen(false);
                  }}
                >
                  <Highlighter size={15} />
                  <span className="min-w-0 flex-1">Toggle shall/may highlight</span>
                  {normativeHighlight && <Check size={15} className="text-brand-700" />}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      <div
        className="scroll-pane relative min-h-0 flex-1 overflow-scroll px-5 py-5 lg:px-8 lg:py-6"
        onScroll={onScroll}
        onWheel={onWheel}
        ref={readingScrollRef}
      >
        {!pdf ? (
          <EmptyReader onImport={onImport} />
        ) : viewMode === "reading" ? (
          <ReadingDocument
            boundaryDirection={boundaryDirection}
            boundaryProgress={boundaryProgress}
            isContentsPage={isContentsPage}
            isFrontMatterPage={isFrontMatterPage}
            nextReadingPage={nextReadingPage}
            normativeHighlight={normativeHighlight}
            onPageChange={onPageChange}
            onViewModeChange={onViewModeChange}
            outline={outline}
            pageNumber={pageNumber}
            pageTransition={pageTransition}
            pdf={pdf}
            readingBlocks={readingBlocks}
            searchFilters={searchFilters}
            searchQuery={searchQuery}
            sectionTitle={sectionTitle}
            zoom={zoom}
          />
        ) : (
          <>
            <div
              className={`mx-auto flex min-h-full max-w-max justify-center rounded-sm bg-white p-1 shadow-[0_2px_12px_rgba(16,24,40,0.12)] ${
                pageTransition ? `page-transition-${pageTransition}` : ""
              }`}
            >
              <canvas ref={canvasRef} className="block max-w-full" />
            </div>
            {boundaryProgress > 0 && (
              <div className="page-boundary-indicator">
                <div className="page-boundary-progress" style={{ width: `${boundaryProgress}%` }} />
                <span>
                  {boundaryDirection === "next" ? "Scroll to turn next page" : "Scroll to return to previous page"}
                </span>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}

function EmptyReader({ onImport }: { onImport(): void }) {
  return (
    <section className="document-sheet mx-auto flex min-h-[720px] max-w-[700px] flex-col items-center justify-center rounded-sm border border-slate-200 bg-white px-16 text-center shadow-[0_2px_12px_rgba(16,24,40,0.08)]">
      <span className="mb-5 grid size-14 place-items-center rounded-2xl bg-brand-50 text-brand-700">
        <BookOpenText size={26} />
      </span>
      <p className="text-xs font-semibold tracking-[0.18em] text-brand-600">ETSI READER</p>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-900">Open an ETSI PDF</h1>
      <p className="mt-4 max-w-md text-sm leading-7 text-slate-500">
        Import a local ETSI specification PDF to view it in Reading or Original mode.
      </p>
      <button
        className="mt-8 flex items-center gap-2 rounded-lg bg-brand-600 px-5 py-3 text-sm font-medium text-white shadow-sm hover:bg-brand-700"
        onClick={onImport}
      >
        <Upload size={16} />
        Import PDF
      </button>
    </section>
  );
}

interface ReadingDocumentProps {
  pdf: PDFDocumentProxy;
  pageNumber: number;
  sectionTitle: string;
  isContentsPage: boolean;
  isFrontMatterPage: boolean;
  outline: OutlineItem[];
  readingBlocks: ReadingBlock[];
  searchQuery: string;
  searchFilters: SearchFilters;
  normativeHighlight: boolean;
  nextReadingPage: number;
  pageTransition: PageDirection | null;
  boundaryProgress: number;
  boundaryDirection: PageDirection;
  zoom: number;
  onViewModeChange(mode: ViewMode): void;
  onPageChange(page: number): void;
}

function ReadingDocument({
  pdf,
  pageNumber,
  sectionTitle,
  isContentsPage,
  isFrontMatterPage,
  outline,
  readingBlocks,
  searchQuery,
  searchFilters,
  normativeHighlight,
  nextReadingPage,
  pageTransition,
  boundaryProgress,
  boundaryDirection,
  zoom,
  onViewModeChange,
  onPageChange,
}: ReadingDocumentProps) {
  return (
    <>
      <article
        className={`document-sheet reader-zoomable mx-auto min-h-full w-full max-w-[760px] border border-slate-200 bg-white px-16 py-12 shadow-[0_2px_12px_rgba(16,24,40,0.08)] ${
          pageTransition ? `page-transition-${pageTransition}` : ""
        }`}
        style={{ "--reader-zoom": zoom / 100 } as CSSProperties}
      >
        <div className="mb-8 flex items-center">
          <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-600">
            Original page {pageNumber}
          </span>
        </div>
        <h1 className="reader-heading mb-8 text-[32px] font-semibold leading-tight tracking-tight">
          <HighlightedText
            normativeHighlight={false}
            searchFilters={searchFilters}
            searchQuery={searchQuery}
            semanticHighlight={false}
            text={sectionTitle}
          />
        </h1>
        {isFrontMatterPage ? (
          <FrontMatterPreview pdf={pdf} pageNumber={pageNumber} onViewModeChange={onViewModeChange} />
        ) : (
          <div className="mb-8 flex items-center justify-between rounded-lg border border-brand-100 bg-brand-50 px-4 py-3 text-xs text-slate-600">
            <span>Figures, tables, and formulas can be checked against the original PDF.</span>
            <button className="font-semibold text-brand-700" onClick={() => onViewModeChange("original")}>
              Open original
            </button>
          </div>
        )}
        {isFrontMatterPage ? null : isContentsPage ? (
          <StructuredContents
            outline={outline}
            onPageChange={onPageChange}
            searchFilters={searchFilters}
            searchQuery={searchQuery}
          />
        ) : (
          <ReadingBody
            blocks={readingBlocks}
            normativeHighlight={normativeHighlight}
            pageNumber={pageNumber}
            searchFilters={searchFilters}
            searchQuery={searchQuery}
          />
        )}
        {pageNumber < pdf.numPages && (
          <div className="page-turn-hint">
            <span>Continue to page {nextReadingPage}</span>
            <ChevronDown size={15} />
          </div>
        )}
      </article>
      {boundaryProgress > 0 && (
        <div className="page-boundary-indicator">
          <div className="page-boundary-progress" style={{ width: `${boundaryProgress}%` }} />
          <span>
            {boundaryDirection === "next" ? "Scroll to turn next page" : "Scroll to return to previous page"}
          </span>
        </div>
      )}
    </>
  );
}

function FrontMatterPreview({
  pdf,
  pageNumber,
  onViewModeChange,
}: {
  pdf: PDFDocumentProxy;
  pageNumber: number;
  onViewModeChange(mode: ViewMode): void;
}) {
  const previewRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let ignored = false;
    let renderTask: ReturnType<PDFPageProxy["render"]> | undefined;
    void pdf.getPage(pageNumber).then((page) => {
      if (ignored) return;
      const canvas = previewRef.current;
      const context = canvas?.getContext("2d");
      if (!canvas || !context) return;
      const originalViewport = page.getViewport({ scale: 1 });
      const viewport = page.getViewport({ scale: Math.min(1, 600 / originalViewport.width) });
      canvas.width = Math.ceil(viewport.width);
      canvas.height = Math.ceil(viewport.height);
      renderTask = page.render({ canvas, canvasContext: context, viewport });
      return renderTask.promise;
    });
    return () => {
      ignored = true;
      renderTask?.cancel();
    };
  }, [pageNumber, pdf]);

  return (
    <section className="front-matter">
      <div className="front-matter-notice">
        <div>
          <p className="front-matter-label">Original layout preserved</p>
          <p className="front-matter-description">
            Cover and preliminary pages are displayed as composed in the source document.
          </p>
        </div>
        <button className="front-matter-action" onClick={() => onViewModeChange("original")}>
          Open original
        </button>
      </div>
      <div className="front-matter-preview">
        <canvas className="front-matter-canvas" ref={previewRef} />
      </div>
    </section>
  );
}

function StructuredContents({
  outline,
  onPageChange,
  searchFilters,
  searchQuery,
}: {
  outline: OutlineItem[];
  onPageChange(page: number): void;
  searchFilters: SearchFilters;
  searchQuery: string;
}) {
  return (
    <nav className="structured-contents" aria-label="Structured document contents">
      <p className="contents-description">
        This contents view is rebuilt from the PDF outline. Select an entry to move to the corresponding original page.
      </p>
      {outline.map((item, index) => (
        <button
          className={`contents-entry contents-level-${Math.min(item.level, 4)}`}
          key={`${item.title}-${item.page}-${index}`}
          onClick={() => onPageChange(item.page)}
        >
          <span className="contents-title">
            <HighlightedText
              normativeHighlight={false}
              searchFilters={searchFilters}
              searchQuery={searchQuery}
              semanticHighlight={false}
              text={item.title}
            />
          </span>
          <span className="contents-leader" />
          <span className="contents-page">{item.page}</span>
        </button>
      ))}
    </nav>
  );
}

function ReadingBody({
  blocks,
  normativeHighlight,
  pageNumber,
  searchFilters,
  searchQuery,
}: {
  blocks: ReadingBlock[];
  normativeHighlight: boolean;
  pageNumber: number;
  searchFilters: SearchFilters;
  searchQuery: string;
}) {
  return (
    <div className="reader-copy">
      {blocks.map((block, index) => {
        if (block.type === "heading") {
          return (
            <h2
              className={block.level <= 2 ? "reader-section-heading" : "reader-subheading"}
              key={`${pageNumber}-heading-${index}`}
            >
              <HighlightedText
                normativeHighlight={false}
                searchFilters={searchFilters}
                searchQuery={searchQuery}
                semanticHighlight={false}
                text={block.text}
              />
            </h2>
          );
        }
        if (block.type === "list") {
          return (
            <ul className="reader-list" key={`${pageNumber}-list-${index}`}>
              {block.items.map((item) => (
                <li key={item}>
                  <HighlightedText
                    normativeHighlight={normativeHighlight}
                    searchFilters={searchFilters}
                    searchQuery={searchQuery}
                    text={item}
                  />
                </li>
              ))}
            </ul>
          );
        }
        return (
          <p key={`${pageNumber}-paragraph-${index}`} className={block.emphasis === "note" ? "note" : ""}>
            <HighlightedText
              normativeHighlight={normativeHighlight}
              searchFilters={searchFilters}
              searchQuery={searchQuery}
              text={block.text}
            />
          </p>
        );
      })}
    </div>
  );
}
