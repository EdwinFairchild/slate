// DeviceContext.tsx
import React, { createContext, useContext, useState, useCallback } from 'react';
import type { Device } from '../types';


interface LogMessage {
  id: string;
  type: 'info' | 'error';
  message: string;
  timestamp: string;
}

interface DeviceContextType {
  selectedDevice: Device | null;
  setSelectedDevice: (device: Device | null) => void;
  addLog: (type: 'info' | 'error', message: string) => void; // Updated signature
  logs: LogMessage[]; // Updated type
}

const DeviceContext = createContext<DeviceContextType | undefined>(undefined);

export const DeviceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [logs, setLogs] = useState<LogMessage[]>([]); // Updated to LogMessage[]

  // Stabilize addLog with useCallback
  const addLog = useCallback((type: 'info' | 'error', message: string) => {
    setLogs((prevLogs) => [
      ...prevLogs,
      {
        id: crypto.randomUUID(),
        type,
        message,
        timestamp: new Date().toISOString(),
      },
    ]);
  }, []);

  // Function to select a device and mark it as connected
  const updateSelectedDevice = useCallback((device: Device | null) => {
    if (device) {
      setSelectedDevice({ ...device, isConnected: true }); // Update isConnected to true
      addLog('info', `Device selected: ${device.name} (${device.address})`);
    } else {
      setSelectedDevice(null);
      addLog('info', `Device deselected`);
    }
  }, [addLog]);

  return (
    <DeviceContext.Provider
      value={{
        selectedDevice,
        setSelectedDevice: updateSelectedDevice,
        addLog, // Expose stabilized addLog
        logs, // Expose logs
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
