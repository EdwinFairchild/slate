const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const { exec } = require('child_process');
const { spawn } = require('child_process');
const Store = require('electron-store');
const store = new Store();
const fs = require('fs');
// const fs = require('fs/promises'); // Import the Promises API
const csvParser = require('csv-parser');

const { createObjectCsvWriter } = require('csv-writer');
// use stringyfy to convert data to csv

const { stringify } = require('csv-stringify');
// Map to track ongoing tests
const ongoingTests = new Map();
const { te } = require('date-fns/locale');
require('events').defaultMaxListeners = 100;
const { parse } = require('fast-csv');
let savedSelectedDevice = null;
let saveDirectory = null;
// Keep this in memory as the “cached” list, loaded on app start.
let allTests = [];
let mainWindowGlobal = null;
//=================================================================================
ipcMain.handle('get-tests', () => {
  console.log('main.js got test from store:', store.get('tests', []));
  // get the savedirectory
  saveDirectory = store.get('saveDirectory', null);
  return store.get('tests', []); // default to empty array
});
//=================================================================================
ipcMain.handle('save-tests', (_, tests) => {
  store.set('tests', tests);
  // save the savedirectory
  store.set('saveDirectory', saveDirectory);
  // console.log('main.js  Saved tests:', tests);
  return { success: true };
});
//=================================================================================
function saveTestsToFile(tests) {
  const filePath = getTestsFilePath();
  try {
    fs.writeFileSync(filePath, JSON.stringify(tests, null, 2));
  } catch (err) {
    console.error('Failed to save tests file:', err);
  }
}
//=================================================================================
function getTestsFilePath() {
  // e.g. /Users/YourName/Library/Application Support/YourApp/slate-tests.json
  return path.join(app.getPath('userData'), 'slate-tests.json');
}
//=================================================================================
ipcMain.handle('selectDirectory', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ['openDirectory'],
  });
  if (canceled || filePaths.length === 0) {
    return null;
  }
  saveDirectory = filePaths[0];
  return filePaths[0];
});
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


  addLog('info', "Resolved Python script path:", pythonScriptPath);

  try {
    const { stdout } = await new Promise((resolve, reject) => {
      exec(
        `python3 ${pythonScriptPath} --discover "${subnet}"`,
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

    addLog('info', 'Raw Python output:', stdout.trim());
    return JSON.parse(stdout.trim()); // Parse JSON response
  } catch (error) {
    addLog('error', 'Error executing discovery:', error);
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
    addLog('error', 'No device selected!');
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
    addLog('error', 'Error executing command:', error);
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

  if (!saveDirectory) {
    addLog('error', 'No save directory selected!');
    return { status: 'error', message: 'No save directory selected' };
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
      '--savedir',
      saveDirectory,
    ]);
    // console.log("Data was the following:", testData);

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
          ongoingTests.delete(currentTestId);
          console.log(`Test ${currentTestId} has been removed from ongoingTests.`);

          // If code = 0, we can interpret that as a natural completion
          if (code === 0) {
            // "test-completed" is just an example channel name
            mainWindowGlobal.webContents.send('test-completed', {
              testId: currentTestId,
            });
          }
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
  const iconPath = app.isPackaged
    ? path.join(process.resourcesPath, 'icons', 'ammeter.png') // Packaged icon path
    : path.join(__dirname, 'assets/icons/ammeter.png'); // Development icon path

  const mainWindow = new BrowserWindow({
    width: 1500,
    height: 1025,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true, // Enables contextBridge
      nodeIntegration: false, // Disables direct Node.js access in renderer
    },
    icon: iconPath, // Dynamically set the icon path
  });

  const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL;

  if (VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(VITE_DEV_SERVER_URL);
    // mainWindow.webContents.openDevTools(); // Uncomment for debugging
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
  mainWindowGlobal = mainWindow;
}
//=================================================================================
ipcMain.handle('dialog:openDirectory', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ['openDirectory']
  });

  if (!canceled) {
    return new Promise((resolve, reject) => {
      fs.readdir(filePaths[0], (err, files) => {
        if (err) {
          console.error('Failed to read directory:', err);
          return reject(err);
        }
        const csvFiles = files.filter(file => file.endsWith('.csv'));
        resolve({
          path: filePaths[0],
          files: csvFiles
        });
      });
    });
  }
  return null;
});
//=================================================================================
let fullDatasetCache = {}; // Cache for full datasets
ipcMain.handle('file:readCSV', async (_, filePath) => {

  return new Promise((resolve, reject) => {
    const previewRows = [];
    let rowCount = 0;

    // Initialize cache for this file
    fullDatasetCache[filePath] = [];

    fs.createReadStream(filePath)
      .pipe(
        parse({
          headers: true, // Treat the first row as headers
          // quote: '"', // Use double quotes for quoted fields
          // escape: '"', // Escape character for quotes
          // ignoreEmpty: true, // Ignore empty rows
          // relaxQuotes: true, // Allow unbalanced quotes
          // skipLinesWithError: true, // Skip malformed rows
        })
      )
      .on('error', (error) => {
        console.error('CSV parsing error:', error);
        reject(error);
      })
      .on('data', (row) => {
        rowCount++;

        if (rowCount % 10000 === 0) {
          console.log('Processed ${ rowCount } rows so far...');
        }

        fullDatasetCache[filePath].push(row);

        if (rowCount <= 10) {
          previewRows.push(row);
        }
      })
      .on('end', () => {
        console.log(`CSV parsing completed. Total rows: ${rowCount}`);

        resolve({
          headers: Object.keys(previewRows[0] || {}),
          data: previewRows,
          totalRows: rowCount,
        });
      });
  });
});


//=================================================================================
ipcMain.handle('file:writeCSV', async (_, { filePath, headers, regexRules }) => {
  try {
    if (!fullDatasetCache[filePath]) {
      throw new Error('Full dataset is not cached. Unable to save.');
    }

    console.log(`Writing CSV to: ${filePath}`);
    console.log(`Cached rows: ${fullDatasetCache[filePath].length}`);

    // Apply regex rules to the entire cached dataset
    const updatedDataset = fullDatasetCache[filePath].map((row) => {
      const updatedRow = { ...row };
      for (const [column, regex] of Object.entries(regexRules)) {
        if (updatedRow[column]) {
          try {
            const regExp = new RegExp(regex, 'g');
            updatedRow[column] = updatedRow[column].replace(regExp, '');
          } catch (err) {
            console.error(`Invalid regex for column "${column}":`, regex, err);
          }
        }
      }
      return updatedRow;
    });

    // Configure the CSV writer
    const csvWriter = createObjectCsvWriter({
      path: filePath,
      header: headers.map((header) => ({ id: header, title: header })),
    });

    // Write the updated dataset back to the file
    await csvWriter.writeRecords(updatedDataset);

    console.log('File saved successfully.');
    return true;
  } catch (error) {
    console.error('Failed to write CSV:', error);
    throw error;
  }
});





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