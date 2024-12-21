import React, { createContext, useContext, useState, useEffect } from 'react';
import { ipcRenderer } from 'electron';
import type { Device } from '../types';

interface LogEntry {
  id: string;
  type: 'info' | 'error';
  message: string;
  timestamp: string;
}

interface DeviceContextType {
  selectedDevice: Device | null;
  setSelectedDevice: (device: Device | null) => void;
  addLog: (type: 'info' | 'error', message: string) => void; // Expose addLog
  logs: LogEntry[]; // Expose logs for display if needed
}

const DeviceContext = createContext<DeviceContextType | undefined>(undefined);

export const DeviceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]); // Array to store logs

  // Function to log messages
  const addLog = (type: 'info' | 'error', message: string) => {
    const newLog = {
      id: crypto.randomUUID(),
      type,
      message,
      timestamp: new Date().toISOString(), // Ensure ISO format
    };
    setLogs((prevLogs) => [...prevLogs, newLog]);
  };

  // Function to select a device and mark it as connected
  const updateSelectedDevice = (device: Device | null) => {
    if (device) {
      setSelectedDevice({ ...device, isConnected: true }); // Update isConnected to true
      addLog('info', `Device selected: ${device.name} (${device.address})`);
    } else {
      setSelectedDevice(null);
      addLog('info', `Device deselected`);
    }
  };

  // Listen for logs from the main process via IPC
  useEffect(() => {
    const handleLogMessage = (_event: any, log: { type: 'info' | 'error'; message: string }) => {
      addLog(log.type, log.message);
    };

    ipcRenderer.on('log-message', handleLogMessage);

    return () => {
      ipcRenderer.removeListener('log-message', handleLogMessage);
    };
  }, []);

  return (
    <DeviceContext.Provider
      value={{
        selectedDevice,
        setSelectedDevice: updateSelectedDevice,
        addLog, // Expose addLog
        logs, // Expose logs if needed
      }}
    >
      {children}
    </DeviceContext.Provider>
  );
};

export const useDevice = () => {
  const context = useContext(DeviceContext);
  if (!context) {
    throw new Error('useDevice must be used within a DeviceProvider');
  }
  return context;
};
