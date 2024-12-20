"use strict";
const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const { exec } = require("child_process");
ipcMain.handle("search-devices", async (_, subnet) => {
  let pythonScriptPath;
  if (app.isPackaged) {
    pythonScriptPath = path.join(process.resourcesPath, "python", "vxi11-api.py");
  } else {
    pythonScriptPath = path.join(__dirname, "../src/services/python/vxi11-api.py");
  }
  console.log("Resolved Python script path:", pythonScriptPath);
  try {
    const { stdout } = await new Promise((resolve, reject) => {
      exec(`python3 ${pythonScriptPath} ${subnet}`, (error, stdout2, stderr) => {
        if (error) {
          reject(error);
        } else if (stderr) {
          reject(stderr);
        } else {
          resolve({ stdout: stdout2 });
        }
      });
    });
    console.log("Raw Python output:", stdout.trim());
    return JSON.parse(stdout);
  } catch (error) {
    console.error("Error running Python script:", error);
    return [];
  }
});
ipcMain.handle("test-command", async (_, command) => {
  let pythonScriptPath;
  if (app.isPackaged) {
    pythonScriptPath = path.join(process.resourcesPath, "python", "vxi11-api.py");
  } else {
    pythonScriptPath = path.join(__dirname, "../src/services/python/vxi11-api.py");
  }
  console.log("Resolved Python script path:", pythonScriptPath);
  try {
    const { stdout } = await new Promise((resolve, reject) => {
      exec(`python3 ${pythonScriptPath} ${command}`, (error, stdout2, stderr) => {
        if (error) {
          console.error("Error running Python script:", stderr);
          reject(error);
        } else {
          resolve({ stdout: stdout2 });
        }
      });
    });
    console.log("Raw Python output:", stdout.trim());
    return stdout.trim();
  } catch (error) {
    console.error("Error executing command:", error);
    return "Error";
  }
});
function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
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
    mainWindow.webContents.openDevTools();
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
