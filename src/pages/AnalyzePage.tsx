import React, { useState } from 'react';
import { FolderOpen } from 'lucide-react';
import { FileList } from '../components/FileList';
import { CSVEditor } from '../components/CSVEditor';
import { CSVPreview } from '../components/CSVPreview';
import { useCSVData } from '../hooks/useCSVData';

export function AnalyzePage() {
  const [directoryPath, setDirectoryPath] = useState<string | null>(null);
  const [files, setFiles] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

  const { data, headers, loading, error, updateColumn } = useCSVData(
    selectedFile ? `${directoryPath}/${selectedFile}` : null
  );

  const handleDirectoryOpen = async () => {
    try {
      const result = await window.api.openDirectory();
      if (result) {
        setDirectoryPath(result.path);
        setFiles(result.files);
        setSelectedFile(null);
      }
    } catch (error) {
      console.error('Failed to open directory:', error);
    }
  };

  return (
    <div className="h-full flex flex-col space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          CSV Analysis
        </h2>
        <p className="text-red-600 font-bold">
          !!Make a back-up of your original file before you edit!!!
        </p>
        <button
          onClick={handleDirectoryOpen}
          className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <FolderOpen className="h-4 w-4 mr-2" />
          Open Directory
        </button>
      </div>

      <div className="flex flex-1 space-x-4 min-h-0">
        <div className="w-64 bg-white dark:bg-gray-800 rounded-lg shadow-sm p-3">
          <FileList
            files={files} // Pass the real files here
            selectedFile={selectedFile}
            onFileSelect={setSelectedFile}
          />
        </div>

        <div className="flex-1 flex flex-col space-y-4 min-h-0">
          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : error ? (
            <div className="flex-1 flex items-center justify-center text-red-600">
              {error}
            </div>
          ) : selectedFile && headers.length > 0 ? (
            <>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
                Showing only a single row of the CSV file for editing
                <CSVEditor
                  headers={headers}
                  data={data[0]} // Pass only the first row of the CSV
                  onUpdateColumn={updateColumn}
                />
              </div>
              <div className="flex-1 bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 min-h-0">
                <CSVPreview headers={headers} data={data} /> {/* Pass full data to preview */}
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
