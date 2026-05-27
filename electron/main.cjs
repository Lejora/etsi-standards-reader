const { app, BrowserWindow, dialog, ipcMain, Menu, shell } = require("electron");
const crypto = require("node:crypto");
const fs = require("node:fs");
const fsp = require("node:fs/promises");
const path = require("node:path");

const isDev = Boolean(process.env.VITE_DEV_SERVER_URL);
let mainWindow;
const appIconPath = path.join(__dirname, "..", "assets", "icon.ico");
const DEFAULT_FOLDER_ID = "etsi-documents";
const DEFAULT_FOLDER = {
  id: DEFAULT_FOLDER_ID,
  name: "ETSI Documents",
  createdAt: null,
  isDefault: true,
};

function createApplicationMenu() {
  return Menu.buildFromTemplate([
    {
      label: "File",
      submenu: [{ role: "quit" }],
    },
    {
      label: "Edit",
      submenu: [
        { role: "undo" },
        { role: "redo" },
        { type: "separator" },
        { role: "cut" },
        { role: "copy" },
        { role: "paste" },
        { role: "selectAll" },
      ],
    },
    {
      label: "View",
      submenu: [
        { role: "reload" },
        { role: "forceReload" },
        { role: "toggleDevTools" },
        { type: "separator" },
        { role: "resetZoom" },
        { role: "zoomIn" },
        { role: "zoomOut" },
        { type: "separator" },
        { role: "togglefullscreen" },
      ],
    },
    {
      label: "Window",
      submenu: [{ role: "minimize" }, { role: "close" }],
    },
  ]);
}

function libraryPaths() {
  const root = path.join(app.getPath("userData"), "library");
  return {
    root,
    originals: path.join(root, "originals"),
    manifest: path.join(root, "documents.json"),
    folders: path.join(root, "folders.json"),
  };
}

async function ensureLibrary() {
  const locations = libraryPaths();
  await fsp.mkdir(locations.originals, { recursive: true });
  return locations;
}

async function readManifest() {
  const { manifest } = await ensureLibrary();
  try {
    const documents = JSON.parse(await fsp.readFile(manifest, "utf8"));
    return documents.map((document) => ({
      ...document,
      folderId: document.folderId ?? DEFAULT_FOLDER_ID,
    }));
  } catch (error) {
    if (error.code === "ENOENT") {
      return [];
    }
    throw error;
  }
}

async function writeManifest(documents) {
  const { manifest } = await ensureLibrary();
  const temp = `${manifest}.tmp`;
  await fsp.writeFile(temp, JSON.stringify(documents, null, 2), "utf8");
  await fsp.rename(temp, manifest);
}

async function readFolders() {
  const { folders } = await ensureLibrary();
  try {
    const savedFolders = JSON.parse(await fsp.readFile(folders, "utf8"));
    return [DEFAULT_FOLDER, ...savedFolders.filter((folder) => folder.id !== DEFAULT_FOLDER_ID)];
  } catch (error) {
    if (error.code === "ENOENT") {
      return [DEFAULT_FOLDER];
    }
    throw error;
  }
}

async function writeFolders(folders) {
  const { folders: folderPath } = await ensureLibrary();
  const customFolders = folders.filter((folder) => folder.id !== DEFAULT_FOLDER_ID);
  const temp = `${folderPath}.tmp`;
  await fsp.writeFile(temp, JSON.stringify(customFolders, null, 2), "utf8");
  await fsp.rename(temp, folderPath);
}

function sha256(filePath) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash("sha256");
    const stream = fs.createReadStream(filePath);
    stream.on("error", reject);
    stream.on("data", (data) => hash.update(data));
    stream.on("end", () => resolve(hash.digest("hex")));
  });
}

async function resolveFolderId(folderId) {
  const candidateId = typeof folderId === "string" ? folderId : DEFAULT_FOLDER_ID;
  const folders = await readFolders();
  return folders.some((folder) => folder.id === candidateId) ? candidateId : DEFAULT_FOLDER_ID;
}

async function importPdf(sourcePath, folderId = DEFAULT_FOLDER_ID) {
  const stat = await fsp.stat(sourcePath);
  const hash = await sha256(sourcePath);
  const documents = await readManifest();
  const existing = documents.find((document) => document.hash === hash);
  if (existing) {
    if (existing.folderId !== folderId) {
      existing.folderId = folderId;
      await writeManifest(documents);
    }
    return { document: existing, duplicate: true };
  }

  const { originals } = await ensureLibrary();
  const storedFileName = `${hash}.pdf`;
  await fsp.copyFile(sourcePath, path.join(originals, storedFileName));
  const document = {
    id: crypto.randomUUID(),
    hash,
    fileName: path.basename(sourcePath),
    storedFileName,
    byteSize: stat.size,
    importedAt: new Date().toISOString(),
    folderId,
  };
  documents.unshift(document);
  await writeManifest(documents);
  return { document, duplicate: false };
}

async function copyDocumentToDownloads(documentId) {
  const documents = await readManifest();
  const document = documents.find((candidate) => candidate.id === documentId);
  if (!document) {
    throw new Error("Document not found.");
  }

  const { originals } = await ensureLibrary();
  const sourcePath = path.join(originals, document.storedFileName);
  const downloadsPath = app.getPath("downloads");
  const parsed = path.parse(document.fileName);
  let destinationPath = path.join(downloadsPath, document.fileName);
  let suffix = 1;
  while (fs.existsSync(destinationPath)) {
    destinationPath = path.join(downloadsPath, `${parsed.name} (${suffix})${parsed.ext}`);
    suffix += 1;
  }
  await fsp.copyFile(sourcePath, destinationPath);
  return { fileName: path.basename(destinationPath), path: destinationPath };
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1460,
    height: 940,
    minWidth: 1100,
    minHeight: 720,
    frame: false,
    titleBarStyle: "hidden",
    autoHideMenuBar: false,
    backgroundColor: "#132528",
    icon: appIconPath,
    title: "ETSI Standards Reader",
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });
  mainWindow.setMenuBarVisibility(true);

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("https://")) {
      void shell.openExternal(url);
    }
    return { action: "deny" };
  });

  const sendMaximizedState = () => {
    if (!mainWindow?.isDestroyed()) {
      mainWindow.webContents.send("window:maximized-changed", mainWindow.isMaximized());
    }
  };
  mainWindow.on("maximize", sendMaximizedState);
  mainWindow.on("unmaximize", sendMaximizedState);

  if (isDev) {
    void mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    void mainWindow.loadFile(path.join(__dirname, "..", "dist", "index.html"));
  }
}

ipcMain.handle("library:list", async () => readManifest());

ipcMain.handle("library:list-folders", async () => readFolders());

ipcMain.handle("library:create-folder", async (_event, name) => {
  const normalizedName = String(name ?? "").trim().replace(/\s+/g, " ");
  if (!normalizedName) {
    throw new Error("Folder name is required.");
  }
  const folders = await readFolders();
  if (folders.some((folder) => folder.name.toLowerCase() === normalizedName.toLowerCase())) {
    throw new Error("A folder with this name already exists.");
  }
  const folder = {
    id: crypto.randomUUID(),
    name: normalizedName,
    createdAt: new Date().toISOString(),
    isDefault: false,
  };
  folders.push(folder);
  await writeFolders(folders);
  return folder;
});

ipcMain.handle("library:move-document", async (_event, documentId, folderId) => {
  const documents = await readManifest();
  const folders = await readFolders();
  if (!folders.some((folder) => folder.id === folderId)) {
    throw new Error("Folder not found.");
  }
  const document = documents.find((candidate) => candidate.id === documentId);
  if (!document) {
    throw new Error("Document not found.");
  }
  document.folderId = folderId;
  await writeManifest(documents);
  return document;
});

ipcMain.handle("library:import-pdf", async (_event, folderId) => {
  const choice = await dialog.showOpenDialog(mainWindow, {
    title: "Import ETSI PDF documents",
    properties: ["openFile", "multiSelections"],
    filters: [{ name: "PDF Documents", extensions: ["pdf"] }],
  });
  if (choice.canceled) {
    return [];
  }
  const resolvedFolderId = await resolveFolderId(folderId);
  return Promise.all(choice.filePaths.map((filePath) => importPdf(filePath, resolvedFolderId)));
});

ipcMain.handle("library:import-dropped-pdfs", async (_event, filePaths, folderId) => {
  const pdfPaths = Array.isArray(filePaths)
    ? filePaths.filter((filePath) => typeof filePath === "string" && path.extname(filePath).toLowerCase() === ".pdf")
    : [];
  if (!pdfPaths.length) {
    return [];
  }
  const resolvedFolderId = await resolveFolderId(folderId);
  return Promise.all(pdfPaths.map((filePath) => importPdf(filePath, resolvedFolderId)));
});

ipcMain.handle("library:read-pdf", async (_event, documentId) => {
  const documents = await readManifest();
  const document = documents.find((candidate) => candidate.id === documentId);
  if (!document) {
    throw new Error("Document not found.");
  }
  const { originals } = await ensureLibrary();
  return fsp.readFile(path.join(originals, document.storedFileName));
});

ipcMain.handle("library:download-pdf", async (_event, documentId) => copyDocumentToDownloads(documentId));

ipcMain.handle("library:location", async () => {
  const { root } = await ensureLibrary();
  return root;
});

ipcMain.handle("window:is-maximized", (event) => {
  const window = BrowserWindow.fromWebContents(event.sender);
  return window?.isMaximized() ?? false;
});

ipcMain.on("window:minimize", (event) => {
  BrowserWindow.fromWebContents(event.sender)?.minimize();
});

ipcMain.on("window:toggle-maximize", (event) => {
  const window = BrowserWindow.fromWebContents(event.sender);
  if (!window) return;
  if (window.isMaximized()) {
    window.unmaximize();
  } else {
    window.maximize();
  }
});

ipcMain.on("window:close", (event) => {
  BrowserWindow.fromWebContents(event.sender)?.close();
});

app.whenReady().then(() => {
  app.setAppUserModelId("com.etsi.standards-reader");
  Menu.setApplicationMenu(createApplicationMenu());
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
