import React, { createContext, useContext, useState } from 'react';
import type { CSVData } from '../types/csv';

interface AnalyzePageContextType {
  directoryPath: string | null;
  setDirectoryPath: React.Dispatch<React.SetStateAction<string | null>>;
  files: string[];
  setFiles: React.Dispatch<React.SetStateAction<string[]>>;
  selectedFile: string | null;
  setSelectedFile: React.Dispatch<React.SetStateAction<string | null>>;
  cachedData: CSVData | null;
  setCachedData: (data: CSVData) => void;
}

const AnalyzePageContext = createContext<AnalyzePageContextType | undefined>(undefined);

export const AnalyzePageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [directoryPath, setDirectoryPath] = useState<string | null>(null);
  const [files, setFiles] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [cachedData, setCachedDataInternal] = useState<CSVData | null>(null);

  const setCachedData = (data: CSVData) => {
    setCachedDataInternal(data);
  };

  return (
    <AnalyzePageContext.Provider
      value={{
        directoryPath,
        setDirectoryPath,
        files,
        setFiles,
        selectedFile,
        setSelectedFile,
        cachedData,
        setCachedData,
      }}
    >
      {children}
    </AnalyzePageContext.Provider>
  );
};

export const useAnalyzePage = () => {
  const context = useContext(AnalyzePageContext);
  if (!context) {
    throw new Error('useAnalyzePage must be used within an AnalyzePageProvider');
  }
  return context;
};
