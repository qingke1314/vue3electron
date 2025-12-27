"use strict";
const electron = require("electron");
electron.contextBridge.exposeInMainWorld("electronAPI", {
  // 检查更新
  checkForUpdates: () => electron.ipcRenderer.send("check-for-updates"),
  // 开始下载更新
  startDownload: () => electron.ipcRenderer.send("start-download"),
  // 更新事件监听
  onUpdateAvailable: (callback) => {
    electron.ipcRenderer.on("update-available", (_event, info) => callback(info));
  },
  onUpdateNotAvailable: (callback) => {
    electron.ipcRenderer.on("update-not-available", (_event, info) => callback(info));
  },
  onUpdateError: (callback) => {
    electron.ipcRenderer.on("update-error", (_event, error) => callback(error));
  },
  onDownloadProgress: (callback) => {
    electron.ipcRenderer.on("download-progress", (_event, progressObj) => callback(progressObj));
  },
  onUpdateDownloaded: (callback) => {
    electron.ipcRenderer.on("update-downloaded", (_event, info) => callback(info));
  },
  // 移除事件监听
  removeAllListeners: (channel) => {
    electron.ipcRenderer.removeAllListeners(channel);
  }
});
