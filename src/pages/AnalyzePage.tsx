// import React from 'react';
import { FolderOpen } from 'lucide-react';
import { FileList } from '../components/FileList';
import { CSVPreview } from '../components/CSVPreview';
import { useCSVData } from '../hooks/useCSVData';
import { useAnalyzePage } from '../components/AnalyzePageContext';
import { Alert } from '../components/ui/Alert';
import React, { useState } from 'react';
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

  const { data, headers, loading, error } = useCSVData(
    selectedFile ? `${directoryPath}/${selectedFile}` : null,
    cachedData,
    setCachedData
  );
  const [regexRules, setRegexRules] = useState({}); // Add state for regex rules

  const handleApplyRegex = (header: string, regex: string) => {
    try {
      const regExp = new RegExp(regex, 'g');
      const newData = cachedData?.data.map(row => ({
        ...row,
        [header]: row[header]?.replace(regExp, ''),
      })) || [];

      setCachedData({ headers, data: newData });

      // Update regex rules state
      setRegexRules(prevRules => ({
        ...prevRules,
        [header]: regex,
      }));

      console.log('Updated cached data:', newData); // Debug log
      console.log('Updated regex rules:', regexRules); // Debug log
    } catch (err) {
      console.error('Error applying regex:', err);
    }
  };

  const handleSaveFile = async () => {
    if (!cachedData || !selectedFile || !directoryPath || Object.keys(regexRules).length === 0) {
      console.error('Missing required data for saving.');
      return;
    }

    const filePath = `${directoryPath}/${selectedFile}`;
    console.log(`Saving file to ${filePath}...`);

    try {
      await window.api.writeCSV({
        filePath,
        headers: cachedData.headers,
        regexRules, // Send regex rules to the backend
      });
      console.log(`File saved successfully to ${filePath}`);
     
    } catch (err) {
      console.error('Failed to save file:', err);
      
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
      console.error('Failed to open directory:', error);
    }
  };

  const handleFileSelect = (file: string) => {
    if (file !== selectedFile) {
      setSelectedFile(file);
      setCachedData(null);
    }
  };

  return (
    <div className="h-full flex flex-col space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">CSV Analysis</h2>
        <Alert
          message="Make a back-up of your original file before you edit!!!"
          type="error"
        />
      </div>
      <button
        onClick={handleDirectoryOpen}
        className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
      >
        <FolderOpen className="h-4 w-4 mr-2" />
        Open Directory
      </button>
      <div className="flex flex-1 space-x-4 min-h-0">
        <div className="w-64 bg-white dark:bg-gray-800 rounded-lg shadow-sm p-3 overflow-y-auto">
          <FileList files={files} selectedFile={selectedFile} onFileSelect={handleFileSelect} />
        </div>

        <div className="flex-1 flex flex-col space-y-4 min-h-0">
          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : error ? (
            <div className="flex-1 flex items-center justify-center text-red-600">{error}</div>
          ) : selectedFile && headers.length > 0 ? (
            <>
              <div className="flex-1 bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 min-h-0">
                <CSVPreview headers={headers} data={data} onApplyRegex={handleApplyRegex} />

              </div>
                <div className="flex justify-end mt-4">
                  <button
                    onClick={handleSaveFile}
                    className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Save File
                  </button>
                </div>
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
