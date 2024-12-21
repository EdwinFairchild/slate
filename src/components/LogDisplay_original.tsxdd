import React from 'react';
import { AlertCircle, Info } from 'lucide-react';
import { useDevice } from '../components/DeviceContext';

export function LogDisplay() {
  const { logs } = useDevice(); // Access logs from context
  const lastLogs = logs.slice(-3).reverse(); // Show only last 3 logs

  return (
    <div className="h-full p-4 overflow-y-auto">
      {lastLogs.length > 0 ? (
        lastLogs.map((log, index) => (
          <div
            key={`${log.timestamp}-${index}`} // Unique key using timestamp and index
            className="flex items-center space-x-2 mb-2"
          >
            {log.type === 'error' ? (
              <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
            ) : (
              <Info className="h-4 w-4 text-blue-500 flex-shrink-0" />
            )}
            <span
              className={`text-sm ${
                log.type === 'error'
                  ? 'text-red-400'
                  : 'text-gray-300'
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
        <div className="text-sm text-gray-500">No messages</div>
      )}
    </div>
  );
}
