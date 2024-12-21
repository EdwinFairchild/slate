import React, { useState } from 'react';
import { Sun, Moon, Menu } from 'lucide-react';
import { Sidebar } from './components/Sidebar';
import { DeviceStatus } from './components/DeviceStatus';
// import { LogDisplay } from './components/LogDisplay';
import { SideLogs } from './components/SideLogs';

import { useDevice } from './components/DeviceContext';

import { TestsPage } from './pages/TestsPage';
import { TempPage } from './pages/TempPage';
import { MockInstrument } from './services/mockInstrument';
import { useTheme } from './hooks/useTheme';
import { TestResultsTable } from './components/TestResultsTable';
import type { SCPICommand, Device, LogMessage, Page } from './types';
import type { TestResult } from './types/test';

export default function App() {
  const { theme, setTheme } = useTheme();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isLogsOpen, setIsLogsOpen] = useState(true);
  const [commands, setCommands] = useState<SCPICommand[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [tests, setTests] = useState<TestResult[]>([]); // Start with no tests
  const {  addLog } = useDevice();

  const [logs, setLogs] = useState<LogMessage[]>([]);

  const [activePage, setActivePage] = useState<Page>('tests');

  const instrument = MockInstrument.getInstance();
const handleStartTest = async (test: Omit<TestResult, 'id' | 'status' | 'startTime' | 'endTime' | 'logFilePath'>) => {
  try {
    const result = await window.api.startTest(test);

    if (result.status === 'error') {
      // Log the error and throw it so `handleSubmit` can handle it
      console.error(`Test failed: ${result.message}`);
      throw new Error(result.message);
    }

    console.log(`Test started successfully. Log file: ${result.logFilePath}`);

    // Add the new test to the centralized state
    setTests((prevTests) => [
      ...prevTests,
      {
        id: result.id,
        name: result.name,
        duration: result.duration,
        startTime: result.startTime,
        endTime: result.endTime,
        status: result.status,
        logFilePath: result.logFilePath,
      },
    ]);
  } catch (error) {
    console.error(`Unexpected error: ${error}`);
    throw error; // Re-throw to be caught by `handleSubmit`
  }
};
const stopTestInState = (testId: string) => {
  setTests((prevTests) =>
    prevTests.map((test) =>
      test.id === testId ? { ...test, status: 'stopped', endTime: new Date().toISOString() } : test
    )
  );
};



const handleStopTest = async (testId: string) => {
  try {
    const response = await window.api.stopTest(testId); // Using the IPC API

    if (response.status === 'success') {
      addLog('info',`Test ${testId} stopped successfully.`);
      stopTestInState(testId); // Update the state to reflect the stopped test
    } else {
      addLog('error',`Failed to stop test ${testId}: ${response.message}`);
    }
  } catch (error) {
    addLog('error',`Error stopping test ${testId}:${error}`);
  }
};




  const handleRerunTest = (testId: string) => {
    addLog('info',`Rerunning test with ID: ${testId}`);
    // Logic for rerunning a test can be added later
  };

  const handleSearchDevices = async () => {
    setIsSearching(true);
    try {
      const foundDevices = await instrument.searchDevices();
      setDevices(foundDevices);
      addLog('info', `Found ${foundDevices.length} devices`);
    } catch (error) {
      addLog('error', `Failed to search devices: ${error}`);
    } finally {
      setIsSearching(false);
    }
  };



  // const addLog = (type: 'info' | 'error', message: string) => {
  //   setLogs(prev => [...prev, {
  //     id: crypto.randomUUID(),
  //     type,
  //     message,
  //     timestamp: new Date().toISOString()
  //   }]);
  // };



  const renderActivePage = () => {
    switch (activePage) {
      case 'tests':
        return <TestsPage tests={tests} onStartTest={handleStartTest} />;
      case 'temp':
        return <TempPage />;
      default:
        return <TestsPage tests={tests} onStartTest={handleStartTest} />;
    }
  };

  return (
   
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-200">
        <Sidebar
          isOpen={isSidebarOpen}
          devices={devices}
          isSearching={isSearching}
          activePage={activePage}
          onSearchDevices={handleSearchDevices}
          onNavigate={setActivePage}
        />

        <div
          className={`transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-0'} ${isLogsOpen ? 'mr-64' : 'mr-0'}`}
        >
          <div className="container mx-auto px-4 py-8 h-screen flex flex-col">
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                  className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                >
                  <Menu className="h-5 w-5" />
                </button>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  S.L.A.T.E
                </h1>
              </div>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                  className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                >
                  {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                </button>
                <button
                  onClick={() => setIsLogsOpen(!isLogsOpen)}
                  className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                >
                  Logs
                </button>
              </div>
            </div>

            <main className="mb-8">
              <DeviceStatus /> {/* Use DeviceStatus here */}
            </main>

            <div className="flex-1 overflow-hidden">
              {renderActivePage()}
            </div>
            <div className="mt-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Test Results
              </h2>
              <TestResultsTable
              tests={tests} // Pass the centralized state
              onStopTest={handleStopTest}
              onRerunTest={handleRerunTest}
            />
            </div>
          </div>
        </div>

        <SideLogs isOpen={isLogsOpen} onToggle={() => setIsLogsOpen(!isLogsOpen)} />
      </div>
    
  );
}