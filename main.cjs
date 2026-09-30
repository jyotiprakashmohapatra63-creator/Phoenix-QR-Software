const { app, BrowserWindow, shell } = require('electron');
const path = require('path');

// Once GitHub Pages is enabled on Phoenix-QR-Update, packaged desktop apps
// load the latest web code at launch automatically. If the device is offline
// or Pages is temporarily unavailable, the copy bundled inside www remains available as fallback.
const LIVE_APP_URL = 'https://jyotiprakashmohapatra63-creator.github.io/Phoenix-QR-Update/';

function createWindow() {
  const window = new BrowserWindow({
    width: 1220,
    height: 860,
    minWidth: 360,
    minHeight: 620,
    autoHideMenuBar: true,
    title: 'Phoenix Edit Point — Payment Slate',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  const loadApp = async () => {
    if (app.isPackaged) {
      try {
        await window.loadURL(`${LIVE_APP_URL}?v=${Date.now()}`);
        return;
      } catch (error) {
        console.warn('Live app could not be loaded; using bundled copy instead.', error);
      }
    }
    await window.loadFile(path.join(__dirname, 'www', 'index.html'));
  };

  loadApp();

  window.webContents.setWindowOpenHandler(({ url }) => {
    if (url === 'about:blank') {
      return {
        action: 'allow',
        overrideBrowserWindowOptions: {
          autoHideMenuBar: true,
          width: 1100,
          height: 800,
          webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true }
        }
      };
    }
    if (/^https?:/i.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
