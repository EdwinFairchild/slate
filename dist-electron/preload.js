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
    saveSelectedDevice: (device) => ipcRenderer.invoke("save-selected-device", device),
    startTest: (testData) => {
      return ipcRenderer.invoke("start-test", testData);
    },
    stopTest: (testId) => ipcRenderer.invoke("stop-test", testId),
    selectDirectory: () => ipcRenderer.invoke("selectDirectory"),
    getTests: () => ipcRenderer.invoke("get-tests"),
    saveTests: (tests) => ipcRenderer.invoke("save-tests", tests),
    onTestCompleted: (callback) => ipcRenderer.on("test-completed", callback),
    offTestCompleted: (callback) => ipcRenderer.off("test-completed", callback),
    openDirectory: () => ipcRenderer.invoke("dialog:openDirectory"),
    readCSV: (filePath) => ipcRenderer.invoke("file:readCSV", filePath),
    writeCSV: (params) => ipcRenderer.invoke("file:writeCSV", params)
  }
);
