const { contextBridge, ipcRenderer } = require('electron');


// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld(
  'api', {
  send: (channel, data) => {
    // whitelist channels
    const validChannels = ['toMain'];
    if (validChannels.includes(channel)) {
      ipcRenderer.send(channel, data);
    }
  },
  receive: (channel, func) => {
    const validChannels = ['fromMain'];
    if (validChannels.includes(channel)) {
      // Deliberately strip event as it includes `sender` 
      ipcRenderer.on(channel, (event, ...args) => func(...args));
    }
  },
  searchDevices: (subnet) => {

    return ipcRenderer.invoke('search-devices', subnet);
  },
  testCommand: (command) => {
    return ipcRenderer.invoke('test-command', command);
  },
  saveSelectedDevice: (device) => ipcRenderer.invoke('save-selected-device', device),
},
);