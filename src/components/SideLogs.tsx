import React from 'react';
import { AlertCircle, Info } from 'lucide-react';
import { useDevice } from '../components/DeviceContext';

interface SideLogsProps {
  isOpen: boolean;
  onToggle: () => void;
}

export function SideLogs({ isOpen, onToggle }: SideLogsProps) {
  const { logs } = useDevice();
  const lastLogs = logs.slice(-10).reverse(); // Display last 10 logs

  return (
    <div
      className={`fixed right-0 top-0 h-full bg-white dark:bg-gray-800 shadow-lg transition-all duration-300 ${
        isOpen ? 'w-64' : 'w-0'
      } overflow-hidden`}
    >
      <div className="flex flex-col h-full">
        {/* Header */}
     

        {/* Logs */}
        <div className="flex-1 p-4 overflow-y-auto">
          {lastLogs.length > 0 ? (
            lastLogs.map((log, index) => (
              <div key={`${log.timestamp}-${index}`} className="flex items-start space-x-2 mb-2">
                {log.type === 'error' ? (
                  <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                ) : (
                  <Info className="h-4 w-4 text-blue-500 flex-shrink-0" />
                )}
                <div className="flex-1">
                  <span
                    className={`block text-sm ${
                      log.type === 'error' ? 'text-red-400' : 'text-gray-500'
                    }`}
                    style={{
                      overflowWrap: 'break-word',
                      wordBreak: 'break-word',
                    }}
                  >
                    {log.message}
                  </span>
                  <span className="text-xs text-gray-500 flex-shrink-0">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-sm text-gray-500">No logs available</div>
          )}
        </div>
      </div>
    </div>
  );
}
