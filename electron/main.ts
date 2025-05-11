import { app, BrowserWindow, globalShortcut, ipcMain, Menu, MenuItemConstructorOptions } from 'electron';
import { autoUpdater } from 'electron-updater';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main.js
// │ │ └── preload.js
// │
process.env.APP_ROOT = path.join(__dirname, '..');

// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL'];
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron');
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist');

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
  ? path.join(process.env.APP_ROOT, 'public')
  : RENDERER_DIST;

let win: BrowserWindow | null;

// 配置自动更新
autoUpdater.autoDownload = false;
autoUpdater.autoInstallOnAppQuit = true;

// 使用 import 替代 require
import log from 'electron-log';
autoUpdater.logger = log;
// @ts-ignore
autoUpdater.logger.transports.file.level = 'debug';

function createWindow() {
  win = new BrowserWindow({
    width: 1400,
    height: 800,
    icon: path.join(process.env.APP_ROOT, 'build/icons/icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false, // 禁用 Node 集成
      contextIsolation: true, // 启用上下文隔离
      sandbox: true, // 启用沙箱
      webSecurity: true, // 启用 Web 安全
    },
  });

  // 创建菜单模板
  const template: MenuItemConstructorOptions[] = [
    {
      label: '编辑',
      submenu: [
        { role: 'undo', label: '撤销' },
        { role: 'redo', label: '重做' },
        { type: 'separator' },
        { role: 'cut', label: '剪切' },
        { role: 'copy', label: '复制' },
        { role: 'paste', label: '粘贴' },
        { role: 'delete', label: '删除' },
        { type: 'separator' },
        { role: 'selectAll', label: '全选' }
      ]
    },
    {
      label: '视图',
      submenu: [
        { role: 'reload', label: '重新加载' },
        { role: 'forceReload', label: '强制重新加载' },
        { role: 'toggleDevTools', label: '开发者工具' },
        { type: 'separator' },
        { role: 'resetZoom', label: '重置缩放' },
        { role: 'zoomIn', label: '放大' },
        { role: 'zoomOut', label: '缩小' },
        { type: 'separator' },
        { role: 'togglefullscreen', label: '全屏' }
      ]
    },
    {
      label: '帮助',
      submenu: [
        {
          label: '检查更新',
          click: () => {
            checkForUpdates();
          }
        }
      ]
    }
  ];

  // 创建菜单
  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);

  // Test active push message to Renderer-process.
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', new Date().toLocaleString());
  });

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    // 修改这里的加载路径
    const indexPath = path.join(RENDERER_DIST, 'index.html');
    console.log('Loading index.html from:', indexPath);
    win.loadFile(indexPath);
  }
}

// 检查更新
function checkForUpdates() {
  console.log('Checking for updates...');
  
  // 检查更新
  autoUpdater.checkForUpdates();

  // 更新出错
  autoUpdater.on('error', (err) => {
    console.error('Update error:', err);
    win?.webContents.send('update-error', err.message);
  });

  // 检测到新版本
  autoUpdater.on('update-available', (info) => {
    console.log('Update available:', info);
    win?.webContents.send('update-available', info);
  });

  // 没有新版本
  autoUpdater.on('update-not-available', (info) => {
    console.log('Update not available:', info);
    win?.webContents.send('update-not-available', info);
  });

  // 更新下载进度
  autoUpdater.on('download-progress', (progressObj) => {
    console.log('Download progress:', progressObj);
    win?.webContents.send('download-progress', progressObj);
  });

  // 更新下载完成
  autoUpdater.on('update-downloaded', (info) => {
    console.log('Update downloaded:', info);
    win?.webContents.send('update-downloaded', info);
  });
}

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
    win = null;
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.whenReady().then(() => {
  createWindow();
  checkForUpdates();

  // 注册全局快捷键
  const ret = globalShortcut.register('Control+Shift+D', () => {
    if (win) {
      // 打开或关闭当前窗口的开发者工具
      win.webContents.toggleDevTools();
    }
  });

  if (!ret) {
    console.error('快捷键注册失败');
  }

  // 检查快捷键是否已注册 (可选)
  // console.log('Control+Shift+D 是否已注册:', globalShortcut.isRegistered('Control+Shift+D'));
});

// 应用退出前注销所有快捷键
app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

// 监听渲染进程发来的更新请求
ipcMain.on('check-for-updates', () => {
  checkForUpdates();
});

// 监听开始下载的请求
ipcMain.on('start-download', () => {
  console.log('Starting download...');
  autoUpdater.downloadUpdate();
});
