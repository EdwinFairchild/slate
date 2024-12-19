import React from 'react';
import { AlertCircle, Info } from 'lucide-react';

interface LogMessage {
  id: string;
  type: 'info' | 'error';
  message: string;
  timestamp: string;
}

interface FooterProps {
  logs: LogMessage[];
}

export function Footer({ logs }: FooterProps) {
  const lastLogs = logs.slice(-3).reverse(); // Show only last 3 logs

  return (
    <div className="fixed bottom-0 left-80 right-0 bg-gray-900 dark:bg-gray-950 border-t border-gray-800 shadow-lg z-10">
      <div className="container mx-auto">
        <div className="h-24 overflow-y-auto py-2 space-y-2 px-4">
          {lastLogs.length > 0 ? (
            lastLogs.map((log) => (
              <div key={log.id} className="flex items-center space-x-2">
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
            <div className="text-sm text-gray-500">
              No messages
            </div>
          )}
        </div>
      </div>
    </div>
  );
}