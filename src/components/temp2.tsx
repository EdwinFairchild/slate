import React, { createContext, useContext, useState } from 'react';
import type { Device } from '../types';

interface DeviceContextType {
  selectedDevice: Device | null;
  setSelectedDevice: (device: Device | null) => void;
}

const DeviceContext = createContext<DeviceContextType | undefined>(undefined);

export const DeviceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);

  // Function to select a device and mark it as connected
  const updateSelectedDevice = (device: Device | null) => {
    if (device) {
      setSelectedDevice({ ...device, isConnected: true }); // Update isConnected to true
      // save the address
      
    } else {
      setSelectedDevice(null);
    }
  };

  return (
    <DeviceContext.Provider value={{ selectedDevice, setSelectedDevice: updateSelectedDevice }}>
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
