import React from 'react';
import { AlertCircle, Info, Menu } from 'lucide-react';
import { useDevice } from '../components/DeviceContext';

interface SideLogsProps {
  isOpen: boolean;
  onToggle: () => void;
}

export function SideLogs({ isOpen, onToggle }: SideLogsProps) {
  const { logs } = useDevice();
  const lastLogs = logs.slice(-10).reverse(); // Display last 10 logs

  return (
    <div className="relative overflow-hidden h-full">
      {/* Main content or other elements */}
      <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
        <p className="text-gray-700">Main Content</p>
      </div>
  
      {/* Sidebar */}
      <div
        className={`fixed right-0 top-0 h-full bg-white dark:bg-gray-800 shadow-lg transition-width duration-300 ${
          isOpen ? 'w-60' : 'w-0'
        } overflow-hidden`}
        style={{ zIndex: 1000 }} // Ensure it overlays other elements
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Logs</h2>
          </div>
  
          <div className="flex-1 p-4 overflow-y-auto">
            {lastLogs.length > 0 ? (
              lastLogs.map((log, index) => (
                <div
                  key={`${log.timestamp}-${index}`}
                  className="flex items-center space-x-2 mb-2"
                >
                  {log.type === 'error' ? (
                    <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                  ) : (
                    <Info className="h-4 w-4 text-blue-500 flex-shrink-0" />
                  )}
                  <span
                    className={`text-sm ${
                      log.type === 'error' ? 'text-red-400' : 'text-gray-500'
                    }`}
                  >
                    {log.message}
                  </span>
                  <span className="text-xs text-gray-500 flex-shrink-0">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-sm text-gray-500">No logs available</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
  
}
