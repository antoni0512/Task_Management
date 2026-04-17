/*
 * Local attachment storage abstraction.
 * - In Electron: uses window.electronAPI IPC to read/write files on disk under userData/attachments/{pert_id}.
 * - In browser: uses IndexedDB so the web preview still works.
 *
 * Public API:
 *   listAttachments(pertId) -> [{ name, size, type, mtime, id }]
 *   saveAttachments(pertId, FileList) -> [{ name, size, type, mtime, id }]
 *   readAttachmentUrl(pertId, id) -> blob URL (for preview/download)
 *   deleteAttachment(pertId, id) -> void
 */

export const IS_ELECTRON = typeof window !== "undefined" && !!window.electronAPI;

// ---------- IndexedDB implementation ----------
const DB_NAME = "pert-attachments";
const STORE = "files";

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: "id", autoIncrement: true });
        store.createIndex("pert_id", "pert_id", { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbListByPert(pertId) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const idx = tx.objectStore(STORE).index("pert_id");
    const out = [];
    idx.openCursor(IDBKeyRange.only(pertId)).onsuccess = (e) => {
      const cur = e.target.result;
      if (cur) {
        const v = cur.value;
        out.push({ id: v.id, name: v.name, size: v.size, type: v.type, mtime: v.mtime });
        cur.continue();
      } else {
        resolve(out.sort((a, b) => b.mtime - a.mtime));
      }
    };
    tx.onerror = () => reject(tx.error);
  });
}

async function idbAdd(pertId, file) {
  const db = await openDB();
  const buf = await file.arrayBuffer();
  const record = {
    pert_id: pertId,
    name: file.name,
    size: file.size,
    type: file.type || "application/octet-stream",
    mtime: Date.now(),
    data: buf,
  };
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    const req = tx.objectStore(STORE).add(record);
    req.onsuccess = () => resolve({ id: req.result, name: record.name, size: record.size, type: record.type, mtime: record.mtime });
    req.onerror = () => reject(req.error);
  });
}

async function idbGet(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).get(id);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbDelete(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    const req = tx.objectStore(STORE).delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

// ---------- Public API ----------
export async function listAttachments(pertId) {
  if (IS_ELECTRON) {
    return await window.electronAPI.listAttachments(pertId);
  }
  return await idbListByPert(pertId);
}

export async function saveAttachments(pertId, fileList) {
  const files = Array.from(fileList || []);
  if (IS_ELECTRON) {
    const payload = await Promise.all(
      files.map(async (f) => ({
        name: f.name,
        type: f.type,
        size: f.size,
        buffer: Array.from(new Uint8Array(await f.arrayBuffer())),
      }))
    );
    return await window.electronAPI.saveAttachments(pertId, payload);
  }
  const results = [];
  for (const f of files) {
    results.push(await idbAdd(pertId, f));
  }
  return results;
}

export async function readAttachmentUrl(pertId, id) {
  if (IS_ELECTRON) {
    const { buffer, type } = await window.electronAPI.readAttachment(pertId, id);
    const blob = new Blob([new Uint8Array(buffer)], { type: type || "application/octet-stream" });
    return URL.createObjectURL(blob);
  }
  const rec = await idbGet(id);
  if (!rec) return null;
  const blob = new Blob([rec.data], { type: rec.type || "application/octet-stream" });
  return URL.createObjectURL(blob);
}

export async function deleteAttachment(pertId, id) {
  if (IS_ELECTRON) {
    return await window.electronAPI.deleteAttachment(pertId, id);
  }
  return await idbDelete(id);
}

export function humanSize(bytes) {
  if (bytes == null) return "—";
  const u = ["B", "KB", "MB", "GB"];
  let i = 0;
  let n = bytes;
  while (n >= 1024 && i < u.length - 1) {
    n /= 1024;
    i++;
  }
  return `${n.toFixed(n < 10 && i > 0 ? 1 : 0)} ${u[i]}`;
}
