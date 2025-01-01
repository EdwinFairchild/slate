import React, { useState, useEffect, useCallback } from 'react';
import { Sun, Moon, Menu } from 'lucide-react';
import { Sidebar } from './components/Sidebar';
// import { DeviceStatus } from './components/DeviceStatus';
import { SideLogs } from './components/SideLogs';
import { useDevice } from './components/DeviceContext';
import { TestsPage } from './pages/TestsPage';
import { AnalyzePage } from './pages/AnalyzePage';
import { MockInstrument } from './services/mockInstrument';
import { useTheme } from './hooks/useTheme';
import { TestResultsTable } from './components/TestResultsTable';
import type { SCPICommand, Device, LogMessage, Page } from './types';
import type { TestResult } from './types/test';
import { toast, ToastContainer, Flip, Bounce, Zoom, Slide } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function App() {
  const { theme, setTheme } = useTheme();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isLogsOpen, setIsLogsOpen] = useState(true);
  const [commands, setCommands] = useState<SCPICommand[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [tests, setTests] = useState<TestResult[]>([]);
  const { addLog } = useDevice();

  const [logs, setLogs] = useState<LogMessage[]>([]);
  const [activePage, setActivePage] = useState<Page>('tests');

  const instrument = MockInstrument.getInstance();

  // Listen for "test-completed" from main process
  useEffect(() => {
    const handleTestCompleted = (_event: any, data: { testId: string }) => {

      // Mark that test as completed
      setTests((prevTests) =>
        prevTests.map((t) =>
          t.id === data.testId
            ? {
              ...t,
              status: 'completed',
              endTime: new Date().toISOString(),
            }
            : t
        )
      );
      addLog('info', `Test ${data.testId} completed naturally.`);
      toast.success(`Test ${data.testId} completed.`);
    };

    window.api.onTestCompleted(handleTestCompleted);

    return () => {
      window.api.offTestCompleted(handleTestCompleted);

    };
  }, [addLog]); // Now, addLog is stable due to useCallback


  // Start test
  const handleStartTest = async (
    test: Omit<TestResult, 'id' | 'status' | 'startTime' | 'endTime' | 'logFilePath'>
  ) => {
    try {
      // python backend returns file path of the log file
      const result = await window.api.startTest(test);
      if (result.status === 'error') {
        addLog('error', `Test failed: ${result.message}`);
        throw new Error(result.message);
      }

      addLog('info', `Test started successfully.\nSaving to: ${result.logFilePath}`);
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
      addLog('error', `Unexpected error: ${error}`);
      throw error;
    }
  };

  // Stop a running test in state
  const stopTestInState = (testId: string) => {
    setTests((prevTests) =>
      prevTests.map((test) =>
        test.id === testId
          ? { ...test, status: 'stopped', endTime: new Date().toISOString() }
          : test
      )
    );
  };

  // Stop test via IPC
  const handleStopTest = async (testId: string) => {
    try {
      const response = await window.api.stopTest(testId);
      if (response.status === 'success') {
        addLog('info', `Test ${testId} stopped successfully.`);
        stopTestInState(testId);
      } else {
        addLog('error', `Failed to stop test ${testId}: ${response.message}`);
      }
    } catch (error) {
      addLog('error', `Error stopping test ${testId}: ${error}`);
    }
  };

  // (Optional) Rerun test
  const handleRerunTest = (testId: string) => {
    addLog('info', `Rerunning test with ID: ${testId}`);
    // not implemented, probably dont need it
  };

  // **New**: Remove test from table (and stop it if it’s running)
  const handleRemoveTest = async (testId: string, status: string) => {
    // If running, stop the test
    addLog('info', `Stopping test ${testId} ...`);
    if (status === 'running') {
      const response = await window.api.stopTest(testId);
      if (response.status !== 'success') {
        addLog('error', `Failed to stop test ${testId}: ${response.message}`);
        return;
      }
    }
    else {
      addLog('info', `Test ${testId} is not running.`);
    }
    // Now remove from state
    setTests((prevTests) => prevTests.filter((t) => t.id !== testId));
    addLog('info', `Test ${testId} stopped and removed from table.`);
    toast.success(`Test ${testId} stopped and removed.`);
  };

  // Search devices
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

  const renderActivePage = () => {
    switch (activePage) {
      case 'tests':
        return <TestsPage tests={tests} onStartTest={handleStartTest} />;
      case 'analyze':
        return <AnalyzePage />;
      default:
        return <TestsPage tests={tests} onStartTest={handleStartTest} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-gray-100 to-gray-150 dark:from-gray-900 dark:to-gray-800 transition-colors duration-200">
      <Sidebar
      isOpen={isSidebarOpen}
      devices={devices}
      isSearching={isSearching}
      activePage={activePage}
      onSearchDevices={handleSearchDevices}
      onNavigate={setActivePage}
      />

      <div
        className={`transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-0'
          } ${isLogsOpen ? 'mr-64' : 'mr-0'}`}
      >
        <div className="container mx-auto px-4 py-8 h-screen flex flex-col">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="p-2 rounded-md bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
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
                className="p-2 rounded-md bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
              >
                {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </button>
              <button
                onClick={() => setIsLogsOpen(!isLogsOpen)}
                className="p-2 rounded-md bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
              >
                Logs
              </button>
            </div>
          </div>
          <ToastContainer theme={theme === 'dark' ? 'light' : 'dark'} autoClose={1700} position="bottom-right" transition={Bounce} />
          {/* <main className="mb-8">
            <DeviceStatus />
          </main> */}

          <div className="flex-1 overflow-hidden">
            {renderActivePage()}
          </div>

          <div className="mt-6">

            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              Test Results
            </h2>
            <TestResultsTable
              tests={tests}
              onStopTest={handleStopTest}
              onRerunTest={handleRerunTest}
              // Pass the new callback down
              onRemoveTest={handleRemoveTest}
            />
          </div>
        </div>
      </div>

      <SideLogs isOpen={isLogsOpen} onToggle={() => setIsLogsOpen(!isLogsOpen)} />
    </div>
  );
}
