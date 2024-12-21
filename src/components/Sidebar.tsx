import React from 'react';
import { Search, Loader2, RefreshCw, Activity, Settings } from 'lucide-react';
import { useDevice } from '../components/DeviceContext';
import type { Device } from '../types';

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
  onNavigate
}: SidebarProps) {
  const { selectedDevice, setSelectedDevice } = useDevice();

  return (
    <div
      className={`fixed left-0 top-0 h-full bg-white dark:bg-gray-800 shadow-lg transition-all duration-300 ${
        isOpen ? 'w-60' : 'w-0'
      } overflow-hidden`}
    >
      <div className="flex flex-col h-full">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Navigation</h2>
          <nav className="space-y-2">
            <button
              onClick={() => onNavigate('tests')}
              className={`w-full flex items-center px-3 py-2 rounded-lg text-left transition-colors ${
                activePage === 'tests'
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <Activity className="h-5 w-5 mr-2" />
              Tests
            </button>
            <button
              onClick={() => onNavigate('temp')}
              className={`w-full flex items-center px-3 py-2 rounded-lg text-left transition-colors ${
                activePage === 'temp'
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <Settings className="h-5 w-5 mr-2" />
              Temporary
            </button>
          </nav>
        </div>

        <div className="flex-1 p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Devices</h2>
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
          
          <div className="relative mb-4">
            <input
              type="text"
              placeholder="Search devices..."
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
            />
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          </div>

          <div className="space-y-2">
            {devices.map(device => (
              <button
                key={device.id}
                onClick={() => {
                  setSelectedDevice(device); // Update the context
                  window.api.saveSelectedDevice(device); // Call the exposed API to save globally
                }}
                className={`w-full p-3 rounded-lg text-left transition-colors ${
                  selectedDevice?.id === device.id
                    ? 'bg-blue-100 dark:bg-blue-900'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{device.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{device.address}</p>
                  </div>
                  <span
                    className={`h-2 w-2 rounded-full ${
                      device.isConnected
                        ? 'bg-green-500'
                        : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  />
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
