import {
  BookOpenText,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Check,
  Copy,
  Download,
  Eraser,
  Highlighter,
  MoreVertical,
  PanelLeftClose,
  PanelLeftOpen,
  PenLine,
  Type,
  Upload,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
  type ReactNode,
  type UIEventHandler,
  type WheelEventHandler,
} from "react";
import type { PDFDocumentProxy, PDFPageProxy } from "pdfjs-dist";
import { IconButton } from "../../components/ui/IconButton";
import { HighlightedText } from "./HighlightedText";
import type {
  DrawingPoint,
  DrawingTool,
  OutlineItem,
  PageAnnotation,
  PageDirection,
  ReadingBlock,
  SearchFilters,
  StrokeAnnotation,
  ViewMode,
} from "./types";

interface ReaderPaneProps {
  annotations: PageAnnotation[];
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
  onPageAnnotationsChange(annotations: PageAnnotation[]): void;
  onScroll: UIEventHandler<HTMLDivElement>;
  onWheel: WheelEventHandler<HTMLDivElement>;
}

export function ReaderPane({
  annotations,
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
  onPageAnnotationsChange,
  onScroll,
  onWheel,
}: ReaderPaneProps) {
  const [actionsMenuOpen, setActionsMenuOpen] = useState(false);
  const [drawingTool, setDrawingTool] = useState<DrawingTool | null>(null);
  const [penSize, setPenSize] = useState(3);
  const [textSize, setTextSize] = useState(14);

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
          <>
            <DrawingToolsPanel
              activeTool={drawingTool}
              onPenSizeChange={setPenSize}
              onTextSizeChange={setTextSize}
              onToolChange={setDrawingTool}
              penSize={penSize}
              textSize={textSize}
            />
            <ReadingDocument
              annotations={annotations}
              boundaryDirection={boundaryDirection}
              boundaryProgress={boundaryProgress}
              drawingTool={drawingTool}
              isContentsPage={isContentsPage}
              isFrontMatterPage={isFrontMatterPage}
              nextReadingPage={nextReadingPage}
              normativeHighlight={normativeHighlight}
              onAnnotationsChange={onPageAnnotationsChange}
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
              penSize={penSize}
              textSize={textSize}
              zoom={zoom}
            />
          </>
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
  annotations: PageAnnotation[];
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
  drawingTool: DrawingTool | null;
  penSize: number;
  textSize: number;
  zoom: number;
  onAnnotationsChange(annotations: PageAnnotation[]): void;
  onViewModeChange(mode: ViewMode): void;
  onPageChange(page: number): void;
}

function ReadingDocument({
  annotations,
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
  drawingTool,
  penSize,
  textSize,
  zoom,
  onAnnotationsChange,
  onViewModeChange,
  onPageChange,
}: ReadingDocumentProps) {
  return (
    <>
      <article
        className={`document-sheet reader-zoomable relative mx-auto min-h-full w-full max-w-[760px] overflow-hidden border border-slate-200 bg-white px-16 py-12 shadow-[0_2px_12px_rgba(16,24,40,0.08)] ${
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
        <DrawingLayer
          annotations={annotations}
          activeTool={drawingTool}
          onAnnotationsChange={onAnnotationsChange}
          penSize={penSize}
          textSize={textSize}
        />
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

function DrawingToolsPanel({
  activeTool,
  onPenSizeChange,
  onTextSizeChange,
  onToolChange,
  penSize,
  textSize,
}: {
  activeTool: DrawingTool | null;
  onPenSizeChange(size: number): void;
  onTextSizeChange(size: number): void;
  onToolChange(tool: DrawingTool | null): void;
  penSize: number;
  textSize: number;
}) {
  const tools: { tool: DrawingTool; label: string; icon: ReactNode }[] = [
    { tool: "pen", label: "Pen", icon: <PenLine size={17} /> },
    { tool: "eraser", label: "Eraser", icon: <Eraser size={17} /> },
    { tool: "marker", label: "Marker", icon: <Highlighter size={17} /> },
    { tool: "text", label: "Text", icon: <Type size={17} /> },
  ];

  return (
    <div className="drawing-tools-panel" aria-label="Drawing tools">
      {tools.map(({ tool, label, icon }) => (
        <button
          aria-label={label}
          className={`drawing-tool-button ${activeTool === tool ? "active" : ""}`}
          key={tool}
          onClick={() => onToolChange(activeTool === tool ? null : tool)}
          title={label}
          type="button"
        >
          {icon}
        </button>
      ))}
      {(activeTool === "pen" || activeTool === "text") && (
        <div className="drawing-size-control">
          <span>{activeTool === "pen" ? "Pen" : "Text"}</span>
          <button
            aria-label={activeTool === "pen" ? "Decrease pen size" : "Decrease text size"}
            onClick={() => {
              if (activeTool === "pen") {
                onPenSizeChange(Math.max(1, penSize - 1));
              } else {
                onTextSizeChange(Math.max(10, textSize - 1));
              }
            }}
            type="button"
          >
            -
          </button>
          <input
            aria-label={activeTool === "pen" ? "Pen size" : "Text size"}
            max={activeTool === "pen" ? 10 : 28}
            min={activeTool === "pen" ? 1 : 10}
            onChange={(event) => {
              const nextSize = Number(event.target.value);
              if (activeTool === "pen") {
                onPenSizeChange(nextSize);
              } else {
                onTextSizeChange(nextSize);
              }
            }}
            type="range"
            value={activeTool === "pen" ? penSize : textSize}
          />
          <button
            aria-label={activeTool === "pen" ? "Increase pen size" : "Increase text size"}
            onClick={() => {
              if (activeTool === "pen") {
                onPenSizeChange(Math.min(10, penSize + 1));
              } else {
                onTextSizeChange(Math.min(28, textSize + 1));
              }
            }}
            type="button"
          >
            +
          </button>
          <strong>{activeTool === "pen" ? penSize : textSize}</strong>
        </div>
      )}
    </div>
  );
}

function DrawingLayer({
  activeTool,
  annotations,
  onAnnotationsChange,
  penSize,
  textSize,
}: {
  activeTool: DrawingTool | null;
  annotations: PageAnnotation[];
  onAnnotationsChange(annotations: PageAnnotation[]): void;
  penSize: number;
  textSize: number;
}) {
  const layerRef = useRef<HTMLDivElement>(null);
  const textInputRef = useRef<HTMLTextAreaElement>(null);
  const cancelTextRef = useRef(false);
  const [draftStroke, setDraftStroke] = useState<StrokeAnnotation | null>(null);
  const [draftText, setDraftText] = useState<{ x: number; y: number; text: string } | null>(null);

  useEffect(() => {
    textInputRef.current?.focus();
  }, [draftText?.x, draftText?.y]);

  function pointFromEvent(event: ReactPointerEvent): DrawingPoint {
    const rect = layerRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return {
      x: Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width)),
      y: Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height)),
    };
  }

  function markerPointFromEvent(event: ReactPointerEvent, lockedY?: number): DrawingPoint | null {
    const layerRect = layerRef.current?.getBoundingClientRect();
    if (!layerRect) return null;
    if (typeof lockedY === "number") {
      return {
        x: Math.min(1, Math.max(0, (event.clientX - layerRect.left) / layerRect.width)),
        y: lockedY,
      };
    }
    const textElement = findTextElementAt(event.clientX, event.clientY);
    if (!textElement) return null;
    const textRect = textElement.getBoundingClientRect();
    const styles = window.getComputedStyle(textElement);
    const parsedLineHeight = Number.parseFloat(styles.lineHeight);
    const lineHeight = Number.isFinite(parsedLineHeight)
      ? parsedLineHeight
      : Number.parseFloat(styles.fontSize) * 1.45;
    const lineIndex = Math.max(0, Math.floor((event.clientY - textRect.top) / lineHeight));
    const snappedY = textRect.top + lineIndex * lineHeight + lineHeight * 0.62;
    return {
      x: Math.min(1, Math.max(0, (event.clientX - layerRect.left) / layerRect.width)),
      y: Math.min(1, Math.max(0, (snappedY - layerRect.top) / layerRect.height)),
    };
  }

  function createStroke(tool: "pen" | "marker", point: DrawingPoint): StrokeAnnotation {
    return {
      id: crypto.randomUUID(),
      type: "stroke",
      tool,
      color: tool === "marker" ? "#facc15" : "#1f2937",
      width: tool === "marker" ? 11 : penSize,
      points: [point],
    };
  }

  function commitText() {
    if (!draftText) return;
    if (cancelTextRef.current) {
      cancelTextRef.current = false;
      setDraftText(null);
      return;
    }
    const text = draftText.text.trim();
    if (text) {
      onAnnotationsChange([
        ...annotations,
        {
          id: crypto.randomUUID(),
          type: "text",
          x: draftText.x,
          y: draftText.y,
          color: "#1f2937",
          fontSize: textSize,
          text,
        },
      ]);
    }
    setDraftText(null);
  }

  function eraseAt(point: DrawingPoint) {
    const targetId = findNearestAnnotationId(annotations, point);
    if (!targetId) return;
    onAnnotationsChange(annotations.filter((annotation) => annotation.id !== targetId));
  }

  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (!activeTool) return;
    event.preventDefault();
    event.stopPropagation();
    const point = pointFromEvent(event);
    if (activeTool === "text") {
      commitText();
      cancelTextRef.current = false;
      setDraftText({ ...point, text: "" });
      return;
    }
    if (activeTool === "eraser") {
      eraseAt(point);
      return;
    }
    if (activeTool === "marker") {
      const markerPoint = markerPointFromEvent(event);
      if (!markerPoint) return;
      event.currentTarget.setPointerCapture(event.pointerId);
      setDraftStroke(createStroke("marker", markerPoint));
      return;
    }
    event.currentTarget.setPointerCapture(event.pointerId);
    setDraftStroke(createStroke(activeTool, point));
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (!draftStroke || !activeTool || activeTool === "eraser" || activeTool === "text") return;
    event.preventDefault();
    const point =
      draftStroke.tool === "marker" ? markerPointFromEvent(event, draftStroke.points[0]?.y) : pointFromEvent(event);
    if (!point) return;
    setDraftStroke((current) => {
      if (!current) return current;
      const lastPoint = current.points[current.points.length - 1];
      const threshold = current.tool === "marker" ? 0.012 : 0.004;
      if (Math.hypot(point.x - lastPoint.x, point.y - lastPoint.y) < threshold) return current;
      return { ...current, points: [...current.points, point] };
    });
  }

  function handlePointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    if (!draftStroke) return;
    event.preventDefault();
    event.currentTarget.releasePointerCapture(event.pointerId);
    if (draftStroke.points.length > 1) {
      onAnnotationsChange([...annotations, draftStroke]);
    }
    setDraftStroke(null);
  }

  const visibleAnnotations = draftStroke ? [...annotations, draftStroke] : annotations;

  return (
    <div
      className={`drawing-layer ${activeTool ? "drawing-layer-active" : ""}`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      ref={layerRef}
    >
      <svg className="drawing-svg" preserveAspectRatio="none" viewBox="0 0 100 100">
        {visibleAnnotations.map((annotation) => {
          if (annotation.type !== "stroke") return null;
          return annotation.tool === "marker" ? (
            markerSegments(annotation.points).map((segment, index) => (
              <line
                key={`${annotation.id}-${index}`}
                opacity={0.38}
                stroke={annotation.color}
                strokeLinecap="round"
                strokeWidth={annotation.width}
                vectorEffect="non-scaling-stroke"
                x1={segment.start.x * 100}
                x2={segment.end.x * 100}
                y1={segment.start.y * 100}
                y2={segment.end.y * 100}
              />
            ))
          ) : (
            <polyline
              fill="none"
              key={annotation.id}
              opacity={0.92}
              points={annotation.points.map((point) => `${point.x * 100},${point.y * 100}`).join(" ")}
              stroke={annotation.color}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={annotation.width}
              vectorEffect="non-scaling-stroke"
            />
          );
        })}
      </svg>
      {annotations.map((annotation) =>
        annotation.type === "text" ? (
          <div
            className="drawing-text-note"
            key={annotation.id}
            style={{
              left: `${annotation.x * 100}%`,
              top: `${annotation.y * 100}%`,
              color: annotation.color,
              fontSize: `${annotation.fontSize ?? 14}px`,
            }}
          >
            {annotation.text}
          </div>
        ) : null,
      )}
      {draftText && (
        <textarea
          className="drawing-text-input"
          onBlur={commitText}
          onChange={(event) => setDraftText((current) => (current ? { ...current, text: event.target.value } : current))}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              cancelTextRef.current = true;
              setDraftText(null);
            }
            if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) commitText();
          }}
          onPointerDown={(event) => event.stopPropagation()}
          ref={textInputRef}
          style={{
            fontSize: `${textSize}px`,
            left: `${draftText.x * 100}%`,
            top: `${draftText.y * 100}%`,
          }}
          value={draftText.text}
        />
      )}
    </div>
  );
}

function findTextElementAt(clientX: number, clientY: number) {
  return (
    document
      .elementsFromPoint(clientX, clientY)
      .map((element) =>
        element.closest(
          ".reader-copy p, .reader-list li, .reader-section-heading, .reader-subheading, .reader-heading",
        ),
      )
      .find(Boolean) as HTMLElement | undefined
  );
}

function markerSegments(points: DrawingPoint[]) {
  const segments: { start: DrawingPoint; end: DrawingPoint }[] = [];
  for (let index = 1; index < points.length; index += 1) {
    const start = points[index - 1];
    const end = points[index];
    if (Math.abs(start.y - end.y) < 0.007) {
      segments.push({ start, end });
    }
  }
  return segments;
}

function findNearestAnnotationId(annotations: PageAnnotation[], point: DrawingPoint) {
  let nearest: { id: string; distance: number } | null = null;
  for (const annotation of annotations) {
    const distance =
      annotation.type === "text"
        ? Math.hypot(annotation.x - point.x, annotation.y - point.y)
        : nearestStrokeDistance(annotation.points, point);
    if (!nearest || distance < nearest.distance) {
      nearest = { id: annotation.id, distance };
    }
  }
  return nearest && nearest.distance < 0.035 ? nearest.id : null;
}

function nearestStrokeDistance(points: DrawingPoint[], point: DrawingPoint) {
  if (points.length < 2) return points[0] ? Math.hypot(points[0].x - point.x, points[0].y - point.y) : 1;
  let nearest = Number.POSITIVE_INFINITY;
  for (let index = 1; index < points.length; index += 1) {
    nearest = Math.min(nearest, distanceToSegment(point, points[index - 1], points[index]));
  }
  return nearest;
}

function distanceToSegment(point: DrawingPoint, start: DrawingPoint, end: DrawingPoint) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const lengthSquared = dx * dx + dy * dy;
  if (!lengthSquared) return Math.hypot(point.x - start.x, point.y - start.y);
  const projection = Math.max(0, Math.min(1, ((point.x - start.x) * dx + (point.y - start.y) * dy) / lengthSquared));
  return Math.hypot(point.x - (start.x + projection * dx), point.y - (start.y + projection * dy));
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
