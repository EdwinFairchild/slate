const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { exec } = require('child_process');
const { spawn } = require('child_process');
// Map to track ongoing tests
const ongoingTests = new Map();
const { te } = require('date-fns/locale');
let savedSelectedDevice = null;

//=================================================================================
function addLog(level, ...args) {
  console.log(`[${level.toUpperCase()}]`, ...args);
}
//=================================================================================
ipcMain.handle('save-selected-device', (_, device) => {
  savedSelectedDevice = device;
});
//=================================================================================
ipcMain.handle('search-devices', async (_, subnet) => {
  let pythonScriptPath;
  if (app.isPackaged) {
    pythonScriptPath = path.join(process.resourcesPath, 'python', 'vxi11-api.py');
  } else {
    pythonScriptPath = path.join(__dirname, '../src/services/python/vxi11-api.py');
  }

  addLog('info',"Resolved Python script path:", pythonScriptPath);

  try {
    const { stdout } = await new Promise((resolve, reject) => {
      exec(
        `python3 ${pythonScriptPath} --discover "${subnet}"`,
        (error, stdout, stderr) => {
          if (error) {
            addLog('error','Error running Python script:', stderr);
            reject(error);
          } else {
            resolve({ stdout });
          }
        }
      );
    });

    addLog('info','Raw Python output:', stdout.trim());
    return JSON.parse(stdout.trim()); // Parse JSON response
  } catch (error) {
    addLog('error','Error executing discovery:', error);
    return { error: error.message };
  }
});
//=================================================================================
ipcMain.handle('test-command', async (_, command) => {
  let pythonScriptPath;
  if (app.isPackaged) {
    pythonScriptPath = path.join(process.resourcesPath, 'python', 'vxi11-api.py');
  } else {
    pythonScriptPath = path.join(__dirname, '../src/services/python/vxi11-api.py');
  }

  addLog("Resolved Python script path:", pythonScriptPath);

  if (!savedSelectedDevice || !savedSelectedDevice.address) {
    addLog('error','No device selected!');
    return `Error: No device selected`;
  }
  const ip = savedSelectedDevice.address;

  try {
    const { stdout } = await new Promise((resolve, reject) => {
      exec(
        `python3 ${pythonScriptPath} --ip "${ip}" --command "${command}"`,
        (error, stdout, stderr) => {
          if (error) {
            addLog('error', 'Error running Python script:', stderr);
            reject(error);
          } else {
            resolve({ stdout });
          }
        }
      );
    });

    //addLog(`Command sent to ${deviceName} (${ip}): ${command}`);
    addLog('info', 'Raw Python output:', stdout.trim());
    return stdout.trim(); // Return plain text response
  } catch (error) {
    addLog('error','Error executing command:', error);
    return `Error: ${error.message}`;
  }
});
//=================================================================================
ipcMain.handle('start-test', async (_, testData) => {
  let pythonScriptPath;

  if (app.isPackaged) {
    pythonScriptPath = path.join(process.resourcesPath, 'python', 'vxi11-api.py');
  } else {
    pythonScriptPath = path.join(__dirname, '../src/services/python/vxi11-api.py');
  }

  if (!savedSelectedDevice || !savedSelectedDevice.address) {
    addLog('error', 'No device selected!');
    return { status: 'error', message: 'No device selected' };
  }

  const ip = savedSelectedDevice.address;

  try {
    const startTime = new Date().toISOString();

    // Spawn the Python process
    const childProcess = spawn('python3', [
      pythonScriptPath,
      '--ip',
      ip,
      '--start-test',
      JSON.stringify(testData),
    ]);

    // Generate a unique test ID
    const testId = crypto.randomUUID();
    let currentTestId = null; // Variable to store the test_id after parsing

    const resultPromise = new Promise((resolve, reject) => {
      childProcess.stdout.on('data', (data) => {
        console.log('Raw logs from Python:', data.toString().trim());
        try {
          const parsedData = JSON.parse(data.toString().trim());
          if (parsedData.status === 'running' && !currentTestId) {
            currentTestId = parsedData.test_id || testId; // Store the test_id
            ongoingTests.set(currentTestId, childProcess);

            // Resolve immediately with the initial response
            resolve({
              id: currentTestId,
              name: testData.name,
              duration: testData.duration,
              startTime,
              endTime: null, // Will be updated later
              status: 'running',
              logFilePath: parsedData.log_file_path,
            });

            addLog('info', `Test started successfully. Log file: ${parsedData.log_file_path}`);
          }
        } catch (err) {
          console.error('Error parsing Python response:', err.message);
        }
      });

      childProcess.stderr.on('data', (stderr) => {
        console.error('Error from Python:', stderr.toString().trim());
        reject(stderr.toString().trim());
      });

      childProcess.on('close', (code) => {
        if (code !== 0 && !currentTestId) {
          reject(new Error(`Python script exited with code ${code}`));
        }

        if (currentTestId) {
          ongoingTests.delete(currentTestId); // Use the stored test_id to clean up
          console.log(`Test ${currentTestId} has been removed from ongoingTests.`);
        }
      });
    });

    const initialResult = await resultPromise;
    return initialResult;
  } catch (error) {
    addLog('error', 'Error executing start-test:', error);
    return { status: 'error', message: error.message || 'Unknown error' };
  }
});
//=================================================================================
ipcMain.handle('stop-test', async (_, testId) => {
  if (!ongoingTests.has(testId)) {
    return {
      status: 'error',
      message: `Test with ID ${testId} not found. Available tests: ${Array.from(ongoingTests.keys()).join(', ')}`,
    };
  }

  const childProcess = ongoingTests.get(testId);
  childProcess.kill();
  ongoingTests.delete(testId);

  return { status: 'success', message: `Test ${testId} stopped.` };
});
//=================================================================================
function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1500,
    height: 1025,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true, // Enables contextBridge
      nodeIntegration: false, // Disables direct Node.js access in renderer
    }
  });

  const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL;

  if (VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(VITE_DEV_SERVER_URL);
  //  mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}
//=================================================================================
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});
//=================================================================================
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
//=================================================================================
app.on('before-quit', () => {
  ongoingTests.forEach((childProcess, testId) => {
    console.log(`Terminating test: ${testId}`);
    childProcess.kill(); // Gracefully terminate the process
  });
});