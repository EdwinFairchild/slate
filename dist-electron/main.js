"use strict";
const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const { exec } = require("child_process");
require("date-fns/locale");
let savedSelectedDevice = null;
function addLog(level, ...args) {
  console.log(`[${level.toUpperCase()}]`, ...args);
}
ipcMain.handle("save-selected-device", (_, device) => {
  savedSelectedDevice = device;
});
ipcMain.handle("search-devices", async (_, subnet) => {
  let pythonScriptPath;
  if (app.isPackaged) {
    pythonScriptPath = path.join(process.resourcesPath, "python", "vxi11-api.py");
  } else {
    pythonScriptPath = path.join(__dirname, "../src/services/python/vxi11-api.py");
  }
  addLog("info", "Resolved Python script path:", pythonScriptPath);
  try {
    const { stdout } = await new Promise((resolve, reject) => {
      exec(
        `python3 ${pythonScriptPath} --discover "${subnet}"`,
        (error, stdout2, stderr) => {
          if (error) {
            addLog("error", "Error running Python script:", stderr);
            reject(error);
          } else {
            resolve({ stdout: stdout2 });
          }
        }
      );
    });
    addLog("info", "Raw Python output:", stdout.trim());
    return JSON.parse(stdout.trim());
  } catch (error) {
    addLog("error", "Error executing discovery:", error);
    return { error: error.message };
  }
});
ipcMain.handle("test-command", async (_, command) => {
  let pythonScriptPath;
  if (app.isPackaged) {
    pythonScriptPath = path.join(process.resourcesPath, "python", "vxi11-api.py");
  } else {
    pythonScriptPath = path.join(__dirname, "../src/services/python/vxi11-api.py");
  }
  addLog("Resolved Python script path:", pythonScriptPath);
  if (!savedSelectedDevice || !savedSelectedDevice.address) {
    addLog("error", "No device selected!");
    return `Error: No device selected`;
  }
  const ip = savedSelectedDevice.address;
  try {
    const { stdout } = await new Promise((resolve, reject) => {
      exec(
        `python3 ${pythonScriptPath} --ip "${ip}" --command "${command}"`,
        (error, stdout2, stderr) => {
          if (error) {
            addLog("error", "Error running Python script:", stderr);
            reject(error);
          } else {
            resolve({ stdout: stdout2 });
          }
        }
      );
    });
    addLog("info", "Raw Python output:", stdout.trim());
    return stdout.trim();
  } catch (error) {
    addLog("error", "Error executing command:", error);
    return `Error: ${error.message}`;
  }
});
ipcMain.handle("start-test", async (_, testData) => {
  let pythonScriptPath;
  console.log(testData);
  if (app.isPackaged) {
    pythonScriptPath = path.join(process.resourcesPath, "python", "vxi11-api.py");
  } else {
    pythonScriptPath = path.join(__dirname, "../src/services/python/vxi11-api.py");
  }
  if (!savedSelectedDevice || !savedSelectedDevice.address) {
    addLog("error", "No device selected!");
    return { status: "error", message: "No device selected" };
  }
  const ip = savedSelectedDevice.address;
  try {
    const startTime = (/* @__PURE__ */ new Date()).toISOString();
    const result = await new Promise((resolve, reject) => {
      const testDataJSON = JSON.stringify(testData);
      exec(
        `python3 ${pythonScriptPath} --ip "${ip}" --start-test '${testDataJSON}'`,
        (error, stdout, stderr) => {
          if (error) {
            addLog("error", "Error running Python script:", stderr);
            reject(stderr.trim());
          } else {
            resolve(stdout.trim());
          }
        }
      );
    });
    const parsedResult = JSON.parse(result);
    addLog("info", `Test initiated successfully. Log file: ${parsedResult.log_file_path}`);
    return {
      id: crypto.randomUUID(),
      name: testData.name,
      duration: testData.duration,
      startTime,
      endTime: null,
      // Will be updated when the test ends
      status: "running",
      // Initial status
      logFilePath: parsedResult.log_file_path
    };
  } catch (error) {
    addLog("error", "Error executing start-test:", error);
    return { status: "error", message: error };
  }
});
function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1500,
    height: 1025,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      // Enables contextBridge
      nodeIntegration: false
      // Disables direct Node.js access in renderer
    }
  });
  const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL;
  if (VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
  }
}
app.whenReady().then(() => {
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
