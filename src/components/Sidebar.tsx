import React, { useState, useEffect } from 'react';
import { useDevice } from './DeviceContext';
import { ChartBarIcon, MinusIcon, PlusIcon } from '@heroicons/react/24/outline';
import {
  Activity,
  RefreshCw,
  Loader2,
  Search,
  Github,
} from 'lucide-react';

interface Device {
  id: string;
  name: string;
  address: string;
  isConnected: boolean;
}

interface SidebarProps {
  isOpen: boolean;
  devices: Device[];
  isSearching: boolean;
  activePage: string;
  onSearchDevices: () => void;
  onNavigate: (page: string) => void;
}

export function Sidebar({
  isOpen,
  devices,
  isSearching,
  activePage,
  onSearchDevices,
  onNavigate,
}: SidebarProps) {
  const { selectedDevice, setSelectedDevice, addLog } = useDevice();
  const [zoomLevel, setZoomLevel] = useState(0);

  useEffect(() => {
    // Fetch the initial zoom level when the component mounts
    const initialZoomLevel = window.api.getZoomLevel();
    setZoomLevel(initialZoomLevel);
  }, []);

  const handleZoomIn = () => {
    const newZoomLevel = Math.min(zoomLevel + 0.5, 5); // Limit to max zoom level
    setZoomLevel(newZoomLevel);
    window.api.setZoomLevel(newZoomLevel);
  };

  const handleZoomOut = () => {
    const newZoomLevel = Math.max(zoomLevel - 0.5, -5); // Limit to min zoom level
    setZoomLevel(newZoomLevel);
    window.api.setZoomLevel(newZoomLevel);
  };

  const handleSelectDirectory = async () => {
    try {
      const directory = await window.api.selectDirectory();
      addLog('info', `Selected directory: ${directory}`);
    } catch (error) {
      addLog('error', 'Error selecting directory:', error);
    }
  };

  return (
    <div
      className={`fixed left-0 top-0 h-full bg-white dark:bg-gray-800 shadow-lg transition-all duration-300 ${isOpen ? 'w-64' : 'w-0'
        } overflow-hidden`}
    >
      <div className="flex flex-col h-full">
        {/* Top Section */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Navigation
          </h2>
          <nav className="space-y-2">
            <button
              onClick={() => onNavigate('tests')}
              className={`w-full flex items-center px-3 py-2 rounded-lg text-left transition-colors ${activePage === 'tests'
                  ? 'bg-blue-400 dark:bg-blue-900 text-white dark:text-blue-300'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
            >
              <Activity className="h-5 w-5 mr-2" />
              Tests
            </button>
            <button
              onClick={() => onNavigate('analyze')}
              className={`w-full flex items-center px-3 py-2 rounded-lg text-left transition-colors ${activePage === 'analyze'
                  ? 'bg-blue-400 dark:bg-blue-900 text-white dark:text-blue-300'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
            >
              <ChartBarIcon className="h-5 w-5 mr-2" />
              Analyze
            </button>
          </nav>
        </div>

        {/* Zoom Control Section */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Zoom Level
          </h2>
          <div className="flex items-center space-x-4">
            <button
              onClick={handleZoomOut}
              className="p-2 bg-gray-200 dark:bg-gray-600 rounded-lg text-gray-800 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-500"
            >
              <MinusIcon className="h-5 w-5" aria-hidden="true" />
            </button>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Zoom: {zoomLevel.toFixed(1)}
            </p>
            <button
              onClick={handleZoomIn}
              className="p-2 bg-gray-200 dark:bg-gray-600 rounded-lg text-gray-800 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-500"
            >
              <PlusIcon className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Middle Section: Devices */}
        <div className="flex-1 p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Devices
            </h2>
            <button
              onClick={onSearchDevices}
              disabled={isSearching}
              className="p-2 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-300 disabled:opacity-50"
            >
              {isSearching ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <RefreshCw className="h-5 w-5" />
              )}
            </button>
          </div>

          <div className="space-y-2">
            {devices.map((device) => (
              <button
                key={device.id}
                onClick={() => {
                  setSelectedDevice(device);
                  window.api.saveSelectedDevice(device);
                }}
                className={`w-full p-3 rounded-lg text-left transition-colors ${selectedDevice?.id === device.id
                    ? 'bg-blue-100 dark:bg-blue-900'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {device.name}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {device.address.split(":")[0]}
                    </p>
                  </div>
                  <span
                    className={`h-2 w-2 rounded-full ${device.isConnected
                        ? 'bg-green-500'
                        : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                  />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-auto p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleSelectDirectory}
            className="p-2 mb-2 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-300 disabled:opacity-50 w-full"
          >
            Select Save Directory
          </button>

          <a
            href="https://github.com/EdwinFairchild/slate"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
          >
            <Github className="h-5 w-5" />
            <span>View on GitHub</span>
          </a>
        </div>
      </div>
    </div>
  );
}
