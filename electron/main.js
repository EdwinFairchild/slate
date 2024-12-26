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
// Initialize Maps
const ongoingTests = new Map(); // Map<testId, TestInfo>
const completedTests = new Map(); // Map<testId, TestInfo>

const { te } = require('date-fns/locale');
require('events').defaultMaxListeners = 100;
const { parse } = require('fast-csv');
let savedSelectedDevice = null;
let saveDirectory = null;
// Keep this in memory as the “cached” list, loaded on app start.
let allTests = [];
let fullDatasetCache = {}; // Cache for full datasets
let csvFilePath = null;
let mainWindowGlobal = null;

let chartWindow = null;

ipcMain.handle('get-test-duration', async (_, testId) => {
  let testInfo = ongoingTests.get(testId);
  if (!testInfo) {
    testInfo = completedTests.get(testId);
  }

  if (testInfo) {
    console.log('------------Test duration:', testInfo.duration);
    return testInfo.duration; // Duration in minutes
  } else {
    throw new Error('Test not found');
  }
});
ipcMain.handle('generate-chart', async (_, { filePath, xAxis, yAxis }) => {
  let pythonScriptPath;

  if (app.isPackaged) {
    pythonScriptPath = path.join(process.resourcesPath, 'python', 'charts.py');
  } else {
    pythonScriptPath = path.join(__dirname, '../src/services/python/charts.py');
  }

  addLog('info', 'Resolved Python script path:', pythonScriptPath);
  // Retrieve the current theme
  // Retrieve the current theme from the renderer process
  const theme = await mainWindowGlobal.webContents.executeJavaScript(`
  (function() {
    return localStorage.getItem('theme') || 'light';
  })();
`);

  console.log('Current theme:', theme);

  try {
    const { stdout } = await new Promise((resolve, reject) => {
      exec(
        `python3 ${pythonScriptPath} "${filePath}" "${xAxis}" "${yAxis}" "${theme}"`,
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

    const htmlPath = stdout.trim(); // Python script should return the path to the HTML file
    addLog('info', 'Generated chart HTML path:', htmlPath);

    // Open the generated HTML in a new Electron window
    const chartWindow = new BrowserWindow({
      width: 800,
      height: 600,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false, // Allow loading local HTML with Node.js features
      },
    });
    chartWindow.setMenuBarVisibility(false);
    chartWindow.loadFile(htmlPath);

    return { success: true, message: `Chart loaded in a new window.` };
  } catch (error) {
    addLog('error', 'Error executing chart generation:', error);
    return { error: error.message };
  }
});
//=================================================================================
ipcMain.handle('get-tests', () => {
  // console.log('main.js got test from store:', store.get('tests', []));
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

            // Create the TestInfo object
            const testInfo = {
              childProcess,
              name: testData.name,
              duration: testData.duration, // Duration in minutes
              startTime,
              logFilePath: parsedData.log_file_path,
              status: 'running',
            };

            // **Add this log to verify duration**
            // console.log('Storing TestInfo:', testInfo);

            // Store in ongoingTests
            ongoingTests.set(currentTestId, testInfo);

            // Resolve with initial test details
            resolve({
              id: currentTestId,
              name: testData.name,
              duration: testData.duration,
              startTime,
              endTime: null,
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
        console.log(`Python process closed with code ${code}`);
        if (code !== 0 && !currentTestId) {
          reject(new Error(`Python script exited with code ${code}`));
        }

        if (currentTestId) {
          const testInfo = ongoingTests.get(currentTestId);
          if (testInfo) {
            testInfo.status = code === 0 ? 'completed' : 'failed';
            testInfo.endTime = new Date().toISOString();

            // Move to completedTests
            ongoingTests.delete(currentTestId);
            completedTests.set(currentTestId, testInfo);

            console.log(`Test ${currentTestId} has been moved to completedTests.`);

            // Notify renderer process
            // BrowserWindow.getAllWindows().forEach((window) => {
            if (code === 0) {
              // "test-completed" is just an example channel name
              console.log(`Emitting test-completed for Test ID: ${currentTestId}`);
              mainWindowGlobal.webContents.send('test-completed', {
                testId: currentTestId,
                status: testInfo.status,
                endTime: testInfo.endTime,
              });
            }

          } else {
            // pass

            console.error(`Test Info for Test ID ${currentTestId} not found.`);
          }
        }
      });
    });

    const initialResult = await resultPromise;
    console.log('Initial Test Result:', initialResult);
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

  const testInfo = ongoingTests.get(testId);
  const childProcess = testInfo.childProcess;

  // Debugging logs
  console.log(`Attempting to kill test ${testId}:`, childProcess);
  console.log(`Type of childProcess.kill: ${typeof childProcess.kill}`);

  if (typeof childProcess.kill !== 'function') {
    return {
      status: 'error',
      message: `Cannot kill test ${testId} because childProcess.kill is not a function.`,
    };
  }

  try {
    childProcess.kill();
    ongoingTests.delete(testId);

    return { status: 'success', message: `Test ${testId} stopped.` };
  } catch (error) {
    console.error(`Failed to kill test ${testId}:`, error);
    return { status: 'error', message: `Failed to stop test ${testId}: ${error.message}` };
  }
});

//=================================================================================
function createWindow() {
  const iconPath = app.isPackaged
    ? path.join(process.resourcesPath, 'icons', 'ammeter.png') // Packaged icon path
    : path.join(__dirname, 'assets/icons/ammeter.png'); // Development icon path

  const mainWindow = new BrowserWindow({
    width: 1500,
    height: 900,
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
  // hide the menu
  mainWindow.setMenuBarVisibility(false);
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
          quote: '"', // Use double quotes for quoted fields
          escape: '"', // Escape character for quotes
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

        if (rowCount <= 7) {
          previewRows.push(row);
        }
      })
      .on('end', () => {
        csvFilePath = filePath;
        // console.log(`CSV parsing completed. Total rows: ${rowCount}`);

        // console.log("the file path is:", filePath);
        //print the csv file for testing
        //console.log(fullDatasetCache[filePath]);
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

    // make the fullDatasetCache be same as the updatedDataset
    fullDatasetCache[filePath] = updatedDataset;

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
    cleanupResources();
    app.quit();
  }
});
//=================================================================================
app.on('before-quit', () => {
  cleanupResources();
});
//=================================================================================
function cleanupResources() {
  ongoingTests.forEach((childProcess, testId) => {
    console.log(`Terminating test: ${testId}`);
    try {
      childProcess.kill('SIGKILL'); // Forcefully terminate if necessary
    } catch (error) {
      console.error(`Failed to terminate test: ${testId}`, error);
    }
  });
  ongoingTests.clear();
}