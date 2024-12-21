import React, { createContext, useContext, useState } from 'react';
import type { Device } from '../types';

interface DeviceContextType {
  selectedDevice: Device | null;
  setSelectedDevice: (device: Device | null) => void;
  addLog: (message: string) => void; // Expose addLog
  logs: string[]; // Expose logs for display if needed
}

const DeviceContext = createContext<DeviceContextType | undefined>(undefined);

export const DeviceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [logs, setLogs] = useState<string[]>([]); // Array to store logs

  // Function to log messages
  const addLog = (type: 'info' | 'error', message: string) => {
    setLogs((prevLogs) => [
      ...prevLogs,
      {
        id: crypto.randomUUID(),
        type,
        message,
        timestamp: new Date().toISOString(), // Ensure ISO format
      },
    ]);
  };

  // Function to select a device and mark it as connected
  const updateSelectedDevice = (device: Device | null) => {
    if (device) {
      setSelectedDevice({ ...device, isConnected: true }); // Update isConnected to true
      addLog('info' ,`Device selected: ${device.name} (${device.address})`);
    } else {
      setSelectedDevice(null);
      addLog('info',`Device deselected`);
    }
  };

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
