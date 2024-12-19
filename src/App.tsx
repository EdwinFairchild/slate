import React, { useState } from 'react';
import { Sun, Moon, Menu } from 'lucide-react';
import { Sidebar } from './components/Sidebar';
import { DeviceStatus } from './components/DeviceStatus';
import { LogDisplay } from './components/LogDisplay';
import { TestsPage } from './pages/TestsPage';
import { TempPage } from './pages/TempPage';
import { MockInstrument } from './services/mockInstrument';
import { mockTests } from './services/mockData';
import { useTheme } from './hooks/useTheme';
import { useLogger } from './hooks/useLogger';
import type { SCPICommand, Device, LogMessage, Page } from './types';
import type { TestResult } from './types/test';

export default function App() {
  const { theme, setTheme } = useTheme();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [commands, setCommands] = useState<SCPICommand[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [tests, setTests] = useState<TestResult[]>(mockTests);
  const [logs, setLogs] = useState<LogMessage[]>([]);
  const [activePage, setActivePage] = useState<Page>('tests');
  
  const instrument = MockInstrument.getInstance();

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

  const handleStartTest = (test: any) => {
    // TODO: Implement test start logic
    console.log('Starting test:', test);
  };

  const addLog = (type: 'info' | 'error', message: string) => {
    setLogs(prev => [...prev, {
      id: crypto.randomUUID(),
      type,
      message,
      timestamp: new Date().toISOString()
    }]);
  };

  useLogger(addLog);

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
        selectedDevice={selectedDevice}
        isSearching={isSearching}
        activePage={activePage}
        onDeviceSelect={setSelectedDevice}
        onSearchDevices={handleSearchDevices}
        onNavigate={setActivePage}
      />

      <div
        className={`transition-all duration-300 ${
          isSidebarOpen ? 'ml-80' : 'ml-0'
        }`}
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
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
            >
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
          </div>

          {selectedDevice && (
            <div className="mb-8">
              <DeviceStatus device={selectedDevice} />
            </div>
          )}
          
          <div className="flex-1 overflow-hidden">
            {renderActivePage()}
          </div>

          <div className="h-24 mt-8 bg-gray-800 dark:bg-gray-950 rounded-lg shadow-lg">
            <LogDisplay logs={logs} />
          </div>
        </div>
      </div>
    </div>
  );
}