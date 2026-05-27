import {
  BookOpenText,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Download,
  Highlighter,
  MoreVertical,
  PanelLeftClose,
  Share2,
  Upload,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import type { CSSProperties, RefObject, UIEventHandler, WheelEventHandler } from "react";
import type { PDFDocumentProxy } from "pdfjs-dist";
import { IconButton } from "../../components/ui/IconButton";
import { HighlightedText } from "./HighlightedText";
import type { OutlineItem, PageDirection, ReadingBlock, Theme, ViewMode } from "./types";

interface ReaderPaneProps {
  pdf: PDFDocumentProxy | null;
  viewMode: ViewMode;
  pageNumber: number;
  zoom: number;
  theme: Theme;
  sectionTitle: string;
  isContentsPage: boolean;
  outline: OutlineItem[];
  readingBlocks: ReadingBlock[];
  nextReadingPage: number;
  normativeHighlight: boolean;
  pageTransition: PageDirection | null;
  boundaryProgress: number;
  boundaryDirection: PageDirection;
  canvasRef: RefObject<HTMLCanvasElement | null>;
  readingScrollRef: RefObject<HTMLDivElement | null>;
  onImport(): void;
  onDownload(): void;
  onViewModeChange(mode: ViewMode): void;
  onPageChange(page: number): void;
  onZoomChange(zoom: number): void;
  onThemeChange(theme: Theme): void;
  onNormativeHighlightChange(enabled: boolean): void;
  onScroll: UIEventHandler<HTMLDivElement>;
  onWheel: WheelEventHandler<HTMLDivElement>;
}

export function ReaderPane({
  pdf,
  viewMode,
  pageNumber,
  zoom,
  theme,
  sectionTitle,
  isContentsPage,
  outline,
  readingBlocks,
  nextReadingPage,
  normativeHighlight,
  pageTransition,
  boundaryProgress,
  boundaryDirection,
  canvasRef,
  readingScrollRef,
  onImport,
  onDownload,
  onViewModeChange,
  onPageChange,
  onZoomChange,
  onThemeChange,
  onNormativeHighlightChange,
  onScroll,
  onWheel,
}: ReaderPaneProps) {
  return (
    <main className="flex min-h-0 min-w-0 flex-col overflow-hidden bg-[#f4f7f7]">
      <div className="flex h-[58px] shrink-0 items-center justify-between gap-3 overflow-x-auto border-b border-slate-200 bg-white px-5">
        <div className="flex shrink-0 items-center gap-3">
          <IconButton label="Toggle document panel">
            <PanelLeftClose size={17} />
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
          <IconButton
            active={normativeHighlight}
            label="Toggle shall/may highlight"
            onClick={() => onNormativeHighlightChange(!normativeHighlight)}
          >
            <Highlighter size={16} />
          </IconButton>
          <IconButton label="Share">
            <Share2 size={16} />
          </IconButton>
          <IconButton label="Download original PDF" disabled={!pdf} onClick={onDownload}>
            <Download size={16} />
          </IconButton>
          <IconButton label="More actions">
            <MoreVertical size={16} />
          </IconButton>
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
            nextReadingPage={nextReadingPage}
            normativeHighlight={normativeHighlight}
            onPageChange={onPageChange}
            onThemeChange={onThemeChange}
            onViewModeChange={onViewModeChange}
            outline={outline}
            pageNumber={pageNumber}
            pageTransition={pageTransition}
            pdf={pdf}
            readingBlocks={readingBlocks}
            sectionTitle={sectionTitle}
            theme={theme}
            zoom={zoom}
          />
        ) : (
          <div className="mx-auto flex min-h-full max-w-max justify-center rounded-sm bg-white p-1 shadow-[0_2px_12px_rgba(16,24,40,0.12)]">
            <canvas ref={canvasRef} className="block max-w-full" />
          </div>
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
  theme: Theme;
  sectionTitle: string;
  isContentsPage: boolean;
  outline: OutlineItem[];
  readingBlocks: ReadingBlock[];
  normativeHighlight: boolean;
  nextReadingPage: number;
  pageTransition: PageDirection | null;
  boundaryProgress: number;
  boundaryDirection: PageDirection;
  zoom: number;
  onViewModeChange(mode: ViewMode): void;
  onThemeChange(theme: Theme): void;
  onPageChange(page: number): void;
}

function ReadingDocument({
  pdf,
  pageNumber,
  theme,
  sectionTitle,
  isContentsPage,
  outline,
  readingBlocks,
  normativeHighlight,
  nextReadingPage,
  pageTransition,
  boundaryProgress,
  boundaryDirection,
  zoom,
  onViewModeChange,
  onThemeChange,
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
        <div className="mb-8 flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-600">
            Original page {pageNumber}
          </span>
          <select
            className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-600 outline-none"
            value={theme}
            onChange={(event) => onThemeChange(event.target.value as Theme)}
          >
            <option value="paper">Paper</option>
            <option value="sepia">Sepia</option>
            <option value="night">Night</option>
          </select>
        </div>
        <h1 className="reader-heading mb-8 text-[32px] font-semibold leading-tight tracking-tight">{sectionTitle}</h1>
        <div className="mb-8 flex items-center justify-between rounded-lg border border-brand-100 bg-brand-50 px-4 py-3 text-xs text-slate-600">
          <span>Figures, tables, and formulas can be checked against the original PDF.</span>
          <button className="font-semibold text-brand-700" onClick={() => onViewModeChange("original")}>
            Open original
          </button>
        </div>
        {isContentsPage ? (
          <StructuredContents outline={outline} onPageChange={onPageChange} />
        ) : (
          <ReadingBody blocks={readingBlocks} normativeHighlight={normativeHighlight} pageNumber={pageNumber} />
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

function StructuredContents({
  outline,
  onPageChange,
}: {
  outline: OutlineItem[];
  onPageChange(page: number): void;
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
          <span className="contents-title">{item.title}</span>
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
}: {
  blocks: ReadingBlock[];
  normativeHighlight: boolean;
  pageNumber: number;
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
              {block.text}
            </h2>
          );
        }
        if (block.type === "list") {
          return (
            <ul className="reader-list" key={`${pageNumber}-list-${index}`}>
              {block.items.map((item) => (
                <li key={item}>
                  <HighlightedText normativeHighlight={normativeHighlight} text={item} />
                </li>
              ))}
            </ul>
          );
        }
        return (
          <p key={`${pageNumber}-paragraph-${index}`} className={block.emphasis === "note" ? "note" : ""}>
            <HighlightedText normativeHighlight={normativeHighlight} text={block.text} />
          </p>
        );
      })}
    </div>
  );
}
