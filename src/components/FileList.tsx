import React from 'react';
import { FileSpreadsheet } from 'lucide-react';

interface FileListProps {
  files: string[]; // Receive the actual list of files
  selectedFile: string | null;
  onFileSelect: (file: string) => void;
}

export function FileList({ files, selectedFile, onFileSelect }: FileListProps) {
  return (
    <div className="space-y-1">
      {files.length > 0 ? (
        files.map(file => (
          <button
            key={file}
            onClick={() => onFileSelect(file)}
            className={`w-full flex items-center px-3 py-2 rounded-md text-sm ${
              selectedFile === file
                ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            {file}
          </button>
        ))
      ) : (
        <div className="text-gray-500 text-sm">
          No CSV files found in the selected directory
        </div>
      )}
    </div>
  );
}
