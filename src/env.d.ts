/// <reference types="vite/client" />

interface ManagedDocument {
  id: string;
  hash: string;
  fileName: string;
  storedFileName: string;
  byteSize: number;
  importedAt: string;
  folderId: string;
}

interface LibraryFolder {
  id: string;
  name: string;
  createdAt: string | null;
  isDefault: boolean;
}

interface ImportResult {
  document: ManagedDocument;
  duplicate: boolean;
}

interface DownloadResult {
  fileName: string;
  path: string;
}

interface Window {
  etsiLibrary?: {
    listDocuments(): Promise<ManagedDocument[]>;
    listFolders(): Promise<LibraryFolder[]>;
    createFolder(name: string): Promise<LibraryFolder>;
    moveDocument(documentId: string, folderId: string): Promise<ManagedDocument>;
    importPdfs(folderId?: string): Promise<ImportResult[]>;
    importDroppedPdfs(files: File[], folderId?: string): Promise<ImportResult[]>;
    readPdf(documentId: string): Promise<Uint8Array>;
    downloadPdf(documentId: string): Promise<DownloadResult>;
    deleteDocument(documentId: string): Promise<ManagedDocument[]>;
    revealDocument(documentId: string): Promise<void>;
    getLocation(): Promise<string>;
  };
  etsiClipboard?: {
    writeText(text: string): Promise<void>;
  };
  etsiWindow?: {
    isMaximized(): Promise<boolean>;
    minimize(): void;
    toggleMaximize(): void;
    close(): void;
    onMaximizedChanged(callback: (isMaximized: boolean) => void): () => void;
  };
}
