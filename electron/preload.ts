import { contextBridge, ipcRenderer } from "electron";

// --------- Expose some API to the Renderer process ---------
contextBridge.exposeInMainWorld("electronAPI", {
  // 检查更新
  checkForUpdates: () => ipcRenderer.send('check-for-updates'),
  
  // 开始下载更新
  startDownload: () => ipcRenderer.send('start-download'),
  
  // 更新事件监听
  onUpdateAvailable: (callback: (info: any) => void) => {
    ipcRenderer.on('update-available', (_event, info) => callback(info));
  },
  onUpdateNotAvailable: (callback: (info: any) => void) => {
    ipcRenderer.on('update-not-available', (_event, info) => callback(info));
  },
  onUpdateError: (callback: (error: string) => void) => {
    ipcRenderer.on('update-error', (_event, error) => callback(error));
  },
  onDownloadProgress: (callback: (progressObj: any) => void) => {
    ipcRenderer.on('download-progress', (_event, progressObj) => callback(progressObj));
  },
  onUpdateDownloaded: (callback: (info: any) => void) => {
    ipcRenderer.on('update-downloaded', (_event, info) => callback(info));
  },
  
  // 移除事件监听
  removeAllListeners: (channel: string) => {
    ipcRenderer.removeAllListeners(channel);
  }
});
