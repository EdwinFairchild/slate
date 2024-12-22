import React, { useState, useEffect } from 'react';
import { Sun, Moon, Menu } from 'lucide-react';
import { Sidebar } from './components/Sidebar';
import { DeviceStatus } from './components/DeviceStatus';
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
  const [tests, setTests] = useState<TestResult[]>([]);
  const { addLog } = useDevice();

  const [logs, setLogs] = useState<LogMessage[]>([]);
  const [activePage, setActivePage] = useState<Page>('tests');

  const instrument = MockInstrument.getInstance();

  // 1. Listen for "test-completed" from main process
  useEffect(() => {
    const handleTestCompleted = (_event: any, data: { testId: string }) => {
      // Mark that test as completed
      setTests((prevTests) =>
        prevTests.map((t) =>
          t.id === data.testId
            ? {
                ...t,
                status: 'completed', // or 'done'
                endTime: new Date().toISOString(),
              }
            : t
        )
      );
      addLog('info', `Test ${data.testId} completed naturally.`);
    };

    // Subscribe to the event
    window.api.onTestCompleted(handleTestCompleted);

    // Unsubscribe on unmount to avoid memory leaks
    return () => {
      window.api.offTestCompleted(handleTestCompleted);
    };
  }, [addLog]);

  // 2. Start test
  const handleStartTest = async (
    test: Omit<TestResult, 'id' | 'status' | 'startTime' | 'endTime' | 'logFilePath'>
  ) => {
    try {
      const result = await window.api.startTest(test);

      if (result.status === 'error') {
        console.error(`Test failed: ${result.message}`);
        throw new Error(result.message);
      }

      console.log(`Test started successfully. Log file: ${result.logFilePath}`);
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
      throw error;
    }
  };

  // 3. Stop test in state
  const stopTestInState = (testId: string) => {
    setTests((prevTests) =>
      prevTests.map((test) =>
        test.id === testId
          ? { ...test, status: 'stopped', endTime: new Date().toISOString() }
          : test
      )
    );
  };

  // 4. Stop test via IPC
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

  // 5. Rerun test (optional)
  const handleRerunTest = (testId: string) => {
    addLog('info', `Rerunning test with ID: ${testId}`);
    // Logic for rerunning a test can go here
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
        className={`transition-all duration-300 ${
          isSidebarOpen ? 'ml-64' : 'ml-0'
        } ${isLogsOpen ? 'mr-64' : 'mr-0'}`}
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
            <DeviceStatus />
          </main>

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
            />
          </div>
        </div>
      </div>

      <SideLogs isOpen={isLogsOpen} onToggle={() => setIsLogsOpen(!isLogsOpen)} />
    </div>
  );
}
