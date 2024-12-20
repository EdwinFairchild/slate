"use strict";
const { contextBridge, ipcRenderer } = require("electron");
contextBridge.exposeInMainWorld(
  "api",
  {
    send: (channel, data) => {
      const validChannels = ["toMain"];
      if (validChannels.includes(channel)) {
        ipcRenderer.send(channel, data);
      }
    },
    receive: (channel, func) => {
      const validChannels = ["fromMain"];
      if (validChannels.includes(channel)) {
        ipcRenderer.on(channel, (event, ...args) => func(...args));
      }
    },
    searchDevices: (subnet) => {
      return ipcRenderer.invoke("search-devices", subnet);
    },
    testCommand: (command) => {
      return ipcRenderer.invoke("test-command", command);
    },
    saveSelectedDevice: (device) => ipcRenderer.invoke("save-selected-device", device)
  }
);
