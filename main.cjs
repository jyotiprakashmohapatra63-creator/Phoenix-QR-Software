const { app, BrowserWindow, shell, ipcMain, clipboard, nativeImage } = require('electron');
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
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
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

ipcMain.handle('copy-image', async (event, base64Data) => {
  try {
    let clean = base64Data;
    if (clean.includes(',')) {
      clean = clean.split(',')[1];
    }
    const buffer = Buffer.from(clean, 'base64');
    const img = nativeImage.createFromBuffer(buffer);
    clipboard.writeImage(img);
    return true;
  } catch (err) {
    console.error('IPC copy-image error:', err);
    return false;
  }
});

ipcMain.handle('copy-text', async (event, text) => {
  try {
    clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('IPC copy-text error:', err);
    return false;
  }
});

ipcMain.handle('open-external', async (event, url) => {
  try {
    await shell.openExternal(url);
    return true;
  } catch (err) {
    return false;
  }
});

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
