/* eslint-disable @typescript-eslint/no-require-imports */
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  listAttachments: (pertId) => ipcRenderer.invoke("attachments:list", pertId),
  saveAttachments: (pertId, files) => ipcRenderer.invoke("attachments:save", pertId, files),
  readAttachment: (pertId, id) => ipcRenderer.invoke("attachments:read", pertId, id),
  deleteAttachment: (pertId, id) => ipcRenderer.invoke("attachments:delete", pertId, id),
  openAttachmentsFolder: (pertId) => ipcRenderer.invoke("attachments:open-folder", pertId),
});
