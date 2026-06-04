const { contextBridge, ipcRenderer, webUtils } = require("electron");

contextBridge.exposeInMainWorld("etsiLibrary", {
  listDocuments: () => ipcRenderer.invoke("library:list"),
  listFolders: () => ipcRenderer.invoke("library:list-folders"),
  createFolder: (name) => ipcRenderer.invoke("library:create-folder", name),
  moveDocument: (documentId, folderId) => ipcRenderer.invoke("library:move-document", documentId, folderId),
  importPdfs: (folderId) => ipcRenderer.invoke("library:import-pdf", folderId),
  importDroppedPdfs: (files, folderId) =>
    ipcRenderer.invoke(
      "library:import-dropped-pdfs",
      Array.from(files, (file) => webUtils.getPathForFile(file)),
      folderId,
    ),
  readPdf: (documentId) => ipcRenderer.invoke("library:read-pdf", documentId),
  listAnnotations: (documentId) => ipcRenderer.invoke("library:list-annotations", documentId),
  savePageAnnotations: (documentId, pageNumber, annotations) =>
    ipcRenderer.invoke("library:save-page-annotations", documentId, pageNumber, annotations),
  downloadPdf: (documentId) => ipcRenderer.invoke("library:download-pdf", documentId),
  renameDocument: (documentId, name) => ipcRenderer.invoke("library:rename-document", documentId, name),
  deleteDocument: (documentId) => ipcRenderer.invoke("library:delete-document", documentId),
  revealDocument: (documentId) => ipcRenderer.invoke("library:reveal-document", documentId),
  getLocation: () => ipcRenderer.invoke("library:location"),
});

contextBridge.exposeInMainWorld("etsiClipboard", {
  writeText: (text) => ipcRenderer.invoke("clipboard:write-text", text),
});

contextBridge.exposeInMainWorld("etsiWindow", {
  isMaximized: () => ipcRenderer.invoke("window:is-maximized"),
  minimize: () => ipcRenderer.send("window:minimize"),
  toggleMaximize: () => ipcRenderer.send("window:toggle-maximize"),
  close: () => ipcRenderer.send("window:close"),
  onMaximizedChanged: (callback) => {
    const listener = (_event, isMaximized) => callback(isMaximized);
    ipcRenderer.on("window:maximized-changed", listener);
    return () => ipcRenderer.removeListener("window:maximized-changed", listener);
  },
});
