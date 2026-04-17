/* eslint-disable @typescript-eslint/no-require-imports */
// Electron main process. Runs when launching the app with `yarn electron`.
// In dev, waits for CRA dev server on http://localhost:3000.
// In prod, loads the built index.html from ../build.

const { app, BrowserWindow, ipcMain, shell } = require("electron");
const path = require("path");
const fs = require("fs/promises");
const fssync = require("fs");

const isDev = !app.isPackaged && process.env.ELECTRON_START_URL;

function attachmentsDir(pertId) {
  const base = path.join(app.getPath("userData"), "attachments", sanitize(pertId));
  return base;
}

function sanitize(s) {
  return String(s).replace(/[^a-zA-Z0-9._-]/g, "_");
}

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function createWindow() {
  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    backgroundColor: "#050505",
    titleBarStyle: "hiddenInset",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  const startUrl =
    process.env.ELECTRON_START_URL ||
    `file://${path.join(__dirname, "..", "build", "index.html")}`;
  await win.loadURL(startUrl);

  if (isDev) {
    win.webContents.openDevTools({ mode: "detach" });
  }

  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

// ---------- IPC: attachments ----------
ipcMain.handle("attachments:list", async (_evt, pertId) => {
  const dir = attachmentsDir(pertId);
  if (!fssync.existsSync(dir)) return [];
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const out = [];
  for (const e of entries) {
    if (!e.isFile()) continue;
    const full = path.join(dir, e.name);
    const stat = await fs.stat(full);
    out.push({
      id: e.name,
      name: e.name,
      size: stat.size,
      type: mimeFromName(e.name),
      mtime: stat.mtimeMs,
    });
  }
  out.sort((a, b) => b.mtime - a.mtime);
  return out;
});

ipcMain.handle("attachments:save", async (_evt, pertId, files) => {
  const dir = attachmentsDir(pertId);
  await ensureDir(dir);
  const results = [];
  for (const f of files) {
    const safeName = uniqueName(dir, sanitize(f.name));
    const full = path.join(dir, safeName);
    await fs.writeFile(full, Buffer.from(f.buffer));
    const stat = await fs.stat(full);
    results.push({
      id: safeName,
      name: safeName,
      size: stat.size,
      type: f.type || mimeFromName(safeName),
      mtime: stat.mtimeMs,
    });
  }
  return results;
});

ipcMain.handle("attachments:read", async (_evt, pertId, id) => {
  const full = path.join(attachmentsDir(pertId), sanitize(id));
  const buffer = await fs.readFile(full);
  return {
    buffer: Array.from(new Uint8Array(buffer)),
    type: mimeFromName(id),
  };
});

ipcMain.handle("attachments:delete", async (_evt, pertId, id) => {
  const full = path.join(attachmentsDir(pertId), sanitize(id));
  if (fssync.existsSync(full)) await fs.unlink(full);
  return true;
});

ipcMain.handle("attachments:open-folder", async (_evt, pertId) => {
  const dir = attachmentsDir(pertId);
  await ensureDir(dir);
  shell.openPath(dir);
});

function uniqueName(dir, name) {
  const ext = path.extname(name);
  const base = path.basename(name, ext);
  let candidate = name;
  let i = 1;
  while (fssync.existsSync(path.join(dir, candidate))) {
    candidate = `${base} (${i})${ext}`;
    i++;
  }
  return candidate;
}

function mimeFromName(name) {
  const n = name.toLowerCase();
  if (n.endsWith(".png")) return "image/png";
  if (n.endsWith(".jpg") || n.endsWith(".jpeg")) return "image/jpeg";
  if (n.endsWith(".gif")) return "image/gif";
  if (n.endsWith(".webp")) return "image/webp";
  if (n.endsWith(".pdf")) return "application/pdf";
  if (n.endsWith(".txt")) return "text/plain";
  if (n.endsWith(".json")) return "application/json";
  if (n.endsWith(".csv")) return "text/csv";
  if (n.endsWith(".zip")) return "application/zip";
  return "application/octet-stream";
}
