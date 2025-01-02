// import React from 'react';
import { FolderOpen } from 'lucide-react';
import { FileList } from '../components/FileList';
import { CSVPreview } from '../components/CSVPreview';
import { CSVEditor } from '../components/CSVEditor';
import { useCSVData } from '../hooks/useCSVData';
import { useDevice } from '../components/DeviceContext';
import { useAnalyzePage } from '../components/AnalyzePageContext';
import { Alert } from '../components/ui/Alert';
import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
export function AnalyzePage() {
  const {
    directoryPath,
    setDirectoryPath,
    files,
    setFiles,
    selectedFile,
    setSelectedFile,
    cachedData,
    setCachedData,

  } = useAnalyzePage();
  const { addLog } = useDevice();
  const [selectedXAxis, setSelectedXAxis] = useState<string | null>(null);
  const [selectedYAxis, setSelectedYAxis] = useState<string | null>(null);

  const { data, headers, loading, error, updateColumn } = useCSVData(
    selectedFile ? `${directoryPath}/${selectedFile}` : null,
    cachedData,
    setCachedData
  );
  const [regexRules, setRegexRules] = useState({}); // Add state for regex rules
  const [regexHistory, setRegexHistory] = useState({});

  // Existing imports...
  const [chartData, setChartData] = useState<ChartData<'line'> | null>(null);

  const handleGenerateChart = async () => {
    if (!selectedXAxis || !selectedYAxis || !selectedFile) {
      addLog('error', 'Both X and Y axes and a file must be selected.');
      return;
    }

    try {
      // Invoke the API to generate the chart
      await window.api.generateChart({
        filePath: `${directoryPath}/${selectedFile}`, // Full path to the selected CSV file
        xAxis: selectedXAxis,
        yAxis: selectedYAxis,
      });
    } catch (error) {
      addLog('error', 'Failed to generate chart:', error);
    }
  }
  const handleSelectXAxis = (header: string) => {
    setSelectedXAxis(header);
    addLog('info', 'X Axis selected:', header);
  };

  const handleSelectYAxis = (header: string) => {
    setSelectedYAxis(header);
    addLog('info', 'Y Axis selected:', header);
  };

  const handleApplyRegex = (header: string, regex: string) => {
    try {
      const regExp = new RegExp(regex, 'g');
      const previousColumnData = cachedData?.data.map(row => row[header]) || []; // Save previous state

      const newData = cachedData?.data.map(row => ({
        ...row,
        [header]: row[header]?.replace(regExp, ''),
      })) || [];

      setCachedData({ headers, data: newData });

      // Update regex history
      setRegexHistory(prevHistory => {
        const columnHistory = prevHistory[header] || { current: null, history: [] };

        return {
          ...prevHistory,
          [header]: {
            current: regex,
            history: [
              {
                regex,
                previousState: previousColumnData,
              },
              ...columnHistory.history,
            ].slice(0, 10), // Limit history to 10 entries
          }
        };
      });

      addLog('info', `Applied regex '${regex}' on column '${header}'.`);
    } catch (err) {
      addLog('error', 'Error applying regex:', err);
    }
  };

  const handleUndoRegex = (header: string) => {
    setRegexHistory(prevHistory => {
      const columnHistory = prevHistory[header];

      if (!columnHistory || columnHistory.history.length === 0) {
        addLog('info', `No regex history to undo for column '${header}'.`);
        return prevHistory;
      }

      const [lastCommand, ...newHistory] = columnHistory.history; // Get the last command
      const { previousState } = lastCommand;                     // Extract the previous state

      // Revert column to its previous state
      const newData = cachedData?.data.map((row, index) => ({
        ...row,
        [header]: previousState[index], // Restore previous state for the column
      })) || [];

      setCachedData({ headers, data: newData });

      addLog('info', `Undid regex '${lastCommand.regex}' for column '${header}'.`);

      return {
        ...prevHistory,
        [header]: {
          current: newHistory[0]?.regex || null, // Update current regex
          history: newHistory,
        },
      };
    });
  };

  const handleSaveFile = async () => {
    if (!cachedData || !selectedFile || !directoryPath || Object.keys(regexHistory).length === 0) {
      addLog('error', 'Missing required data for saving.');
      return;
    }

    // Prepare regexRules by extracting the history for each column
    const regexRules = Object.entries(regexHistory).reduce((acc, [header, history]) => {
      acc[header] = history.history.map(entry => entry.regex); // Extract regex list for each column
      return acc;
    }, {});

    console.log('Prepared regexRules:', regexRules);

    const filePath = `${directoryPath}/${selectedFile}`;
    addLog('info', `Saving file to ${filePath}...`);

    try {
      await window.api.writeCSV({
        filePath,
        headers: cachedData.headers,
        regexRules,
      });
      addLog('info', `File saved successfully to ${filePath}`);
      toast.success('File saved successfully!');
    } catch (err) {
      addLog('error', 'Failed to save file:', err);
    }
  };



  const handleDirectoryOpen = async () => {
    try {
      const result = await window.api.openDirectory();
      if (result) {
        setDirectoryPath(result.path);
        setFiles(result.files);
        setSelectedFile(null);
        setCachedData(null);
      }
    } catch (error) {
      addLog('error', 'Failed to open directory:', error);
    }
  };

  const handleFileSelect = (file: string) => {
    if (file !== selectedFile) {
      setSelectedFile(file);
      setCachedData(null);
    }
  };

  // Automatically fetch and open the save directory on load
  useEffect(() => {
    const fetchDirectory = async () => {
      try {
        const directory = await window.api.getSaveDirectory();
        if (directory) {
          setDirectoryPath(directory.path);
          setFiles(directory.files);
        }
      } catch (error) {
        addLog('error', 'Failed to fetch save directory:', error);
      }
    };

    fetchDirectory();
  }, [setDirectoryPath, setFiles, addLog]);
  return (
  <div className="h-full flex flex-col space-y-4">
    <div className="flex flex-1 space-x-4 min-h-0">
      {/* File List Section */}
      <div className="w-64 bg-white dark:bg-gray-800 rounded-md shadow-sm p-3 overflow-y-auto flex-shrink-0">
        <button
          onClick={handleDirectoryOpen}
          className="flex items-center px-3 py-2 rounded-md bg-blue-400 text-white hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 transition mb-2"
        >
          <FolderOpen className="h-4 w-4 mr-2" />
          Open Directory
        </button>
        <FileList files={files} selectedFile={selectedFile} onFileSelect={handleFileSelect} />
      </div>

      {/* Main Content Section */}
      <div className="flex-1 flex flex-col space-y-4 min-h-0">
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : error ? (
          <div className="flex-1 flex items-center justify-center text-red-600">{error}</div>
        ) : selectedFile && headers.length > 0 ? (
          <>
            <div>
              <CSVEditor
                headers={headers}
                selectedXAxis={selectedXAxis}
                selectedYAxis={selectedYAxis}
                onSelectXAxis={handleSelectXAxis}
                onSelectYAxis={handleSelectYAxis}
                onGenerateChart={handleGenerateChart}
              />
            </div>

            {/* Scrollable CSVPreview Section */}
            <div
              className="flex-1 bg-white dark:bg-gray-800 rounded-md shadow-sm p-4 min-h-0 overflow-auto"
              style={{ maxWidth: '100%' }}
            >
              <CSVPreview
                headers={headers}
                data={data}
                onApplyRegex={handleApplyRegex}
                onUndoRegex={handleUndoRegex} // Pass the undo function
              />
            </div>

            <Alert
              message="Make a back-up of your original file before you edit!!!"
              type="error"
            />

            <button
              onClick={handleSaveFile}
              className="px-3 py-2 rounded-md bg-blue-400 text-white hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 transition"
            >
              Save changes to file
            </button>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            Select a CSV file to view and edit its contents
          </div>
        )}
      </div>
    </div>
  </div>
);

}
