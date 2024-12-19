import React from 'react';
import { Activity } from 'lucide-react';
import type { Device } from '../types';

interface DeviceStatusProps {
  device: Device | null;
}

export function DeviceStatus({ device }: DeviceStatusProps) {
  if (!device) {
    return (
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-900 rounded-lg p-4">
        <p className="text-yellow-800 dark:text-yellow-200">
          No device selected. Use the sidebar to select a device.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
      <div className="flex items-center space-x-4">
        <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
          <Activity className="h-6 w-6 text-blue-600 dark:text-blue-300" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {device.name}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Model: {device.model} • IP: {device.address}
          </p>
        </div>
        <div className="ml-auto flex items-center">
          <span
            className={`h-2.5 w-2.5 rounded-full mr-2 ${
              device.isConnected ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
            }`}
          />
          <span className="text-sm text-gray-600 dark:text-gray-300">
            {device.isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>
    </div>
  );
}