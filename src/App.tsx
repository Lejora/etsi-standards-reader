import { useEffect, useState } from "react";
import { AppRail } from "./components/layout/AppRail";
import { TitleBar } from "./components/layout/TitleBar";
import { ToastViewport } from "./components/ui/ToastViewport";
import { WorkspaceHeader } from "./components/layout/WorkspaceHeader";
import { HomeView } from "./features/library/HomeView";
import { LibraryPanel } from "./features/reader/LibraryPanel";
import { ReaderPane } from "./features/reader/ReaderPane";
import { SearchPanel } from "./features/reader/SearchPanel";
import { SettingsPanel } from "./features/reader/SettingsPanel";
import { useReaderWorkspace } from "./features/reader/useReaderWorkspace";
import type { AppMode, ColorTheme } from "./features/reader/types";

const COLOR_THEME_STORAGE_KEY = "etsi-reader-color-theme";

function App() {
  const workspace = useReaderWorkspace();
  const [activeMode, setActiveMode] = useState<AppMode>("home");
  const [selectedFolderId, setSelectedFolderId] = useState("etsi-documents");
  const [colorTheme, setColorTheme] = useState<ColorTheme>(() => {
    const savedTheme = window.localStorage.getItem(COLOR_THEME_STORAGE_KEY);
    return savedTheme === "ocean" ? "ocean" : "forest";
  });

  useEffect(() => {
    window.localStorage.setItem(COLOR_THEME_STORAGE_KEY, colorTheme);
  }, [colorTheme]);

  const selectedFolder =
    workspace.folders.find((folder) => folder.id === selectedFolderId) ?? workspace.folders[0];
  const selectedFolderDocuments = workspace.documents.filter(
    (document) => document.folderId === (selectedFolder?.id ?? selectedFolderId),
  );
  const selectedFolderDocument =
    workspace.activeDocument?.folderId === (selectedFolder?.id ?? selectedFolderId)
      ? workspace.activeDocument
      : null;

  function selectMode(mode: AppMode) {
    if (mode !== "home" && workspace.activeDocument?.folderId !== selectedFolder?.id) {
      const firstDocument = selectedFolderDocuments[0];
      workspace.clearDocument();
      if (firstDocument) {
        void workspace.openDocument(firstDocument);
      }
    }
    setActiveMode(mode);
  }

  return (
    <div
      className={`palette-${colorTheme} theme-${workspace.theme} flex h-screen min-h-0 flex-col overflow-hidden bg-[#f5f7f7] text-slate-800`}
    >
      <TitleBar maximized={workspace.windowMaximized} />
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <AppRail activeMode={activeMode} onModeChange={selectMode} />
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          {activeMode !== "home" && (
            <WorkspaceHeader
              activeDocument={selectedFolderDocument}
              folderName={selectedFolder?.name ?? "ETSI Documents"}
              onBackHome={() => setActiveMode("home")}
              storageLocation={workspace.storageLocation}
            />
          )}
          {activeMode === "home" ? (
            <HomeView
              activeDocument={workspace.activeDocument}
              documents={workspace.documents}
              folders={workspace.folders}
              selectedFolderId={selectedFolderId}
              onCreateFolder={workspace.createFolder}
              onImport={(folderId) => void workspace.importDocuments(folderId, false)}
              onImportFiles={(files, folderId) => void workspace.importDroppedDocuments(files, folderId)}
              onMoveDocument={workspace.moveDocument}
              onSelectFolder={setSelectedFolderId}
              onOpenDocument={(document) => {
                setSelectedFolderId(document.folderId);
                setActiveMode("reader");
                workspace.clearDocument();
                void workspace.openDocument(document);
              }}
            />
          ) : (
            <div className="grid min-h-0 flex-1 grid-cols-[248px_minmax(420px,1fr)] overflow-hidden xl:grid-cols-[278px_minmax(520px,1fr)]">
              {activeMode === "settings" ? (
                <SettingsPanel colorTheme={colorTheme} onColorThemeChange={setColorTheme} />
              ) : activeMode === "search" ? (
                <SearchPanel
                  filters={workspace.searchFilters}
                  hasDocument={Boolean(workspace.pdf)}
                  hasIndex={workspace.hasIndex}
                  hits={workspace.hits}
                  indexStatus={workspace.indexStatus}
                  onFilterChange={workspace.setSearchFilters}
                  onOpenHit={workspace.openSearchHit}
                  onSearchQueryChange={workspace.setSearchQuery}
                  searchQuery={workspace.searchQuery}
                />
              ) : (
                <LibraryPanel
                  activeDocument={selectedFolderDocument}
                  documents={selectedFolderDocuments}
                  folderName={selectedFolder?.name ?? "ETSI Documents"}
                  onImport={() => void workspace.importDocuments(selectedFolder?.id ?? selectedFolderId)}
                  onOpenDocument={(document) => {
                    setSelectedFolderId(document.folderId);
                    void workspace.openDocument(document);
                  }}
                  onSearchQueryChange={workspace.updateLibrarySearch}
                  onSelectPage={workspace.setPageNumber}
                  outline={workspace.outline}
                  pageNumber={workspace.pageNumber}
                  searchQuery={workspace.librarySearchQuery}
                />
              )}
              <ReaderPane
                boundaryDirection={workspace.boundaryDirection}
                boundaryProgress={workspace.boundaryProgress}
                canvasRef={workspace.canvasRef}
                isContentsPage={workspace.isContentsPage}
                nextReadingPage={workspace.nextReadingPage}
                normativeHighlight={workspace.normativeHighlight}
                onImport={() => void workspace.importDocuments(selectedFolder?.id ?? selectedFolderId)}
                onDownload={() => void workspace.downloadDocument()}
                onCopyCitation={() => void workspace.copyCitation()}
                onNormativeHighlightChange={workspace.setNormativeHighlight}
                onPageChange={workspace.setPageNumber}
                onScroll={workspace.handleReaderScroll}
                onThemeChange={workspace.setTheme}
                onViewModeChange={workspace.selectViewMode}
                onWheel={workspace.handleReadingWheel}
                onZoomChange={workspace.setZoom}
                outline={workspace.outline}
                pageNumber={workspace.pageNumber}
                pageTransition={workspace.pageTransition}
                pdf={workspace.pdf}
                readingBlocks={workspace.readingBlocks}
                readingScrollRef={workspace.readingScrollRef}
                sectionTitle={workspace.sectionTitle}
                theme={workspace.theme}
                viewMode={workspace.viewMode}
                zoom={workspace.zoom}
              />
            </div>
          )}
        </div>
      </div>
      <ToastViewport onDismiss={workspace.dismissToast} toasts={workspace.toasts} />
    </div>
  );
}

export default App;
