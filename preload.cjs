const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('ElectronNative', {
  isElectron: true,
  copyImage: (base64Data) => ipcRenderer.invoke('copy-image', base64Data),
  copyText: (text) => ipcRenderer.invoke('copy-text', text),
  openExternal: (url) => ipcRenderer.invoke('open-external', url)
});
