import React from 'react';
import type { LogEntry } from '../types';

interface LogViewerProps {
  logs: LogEntry[];
}

export function LogViewer({ logs }: LogViewerProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
      <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Command Log</h2>
      <div className="h-64 overflow-auto">
        <table className="min-w-full">
          <thead>
            <tr>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Timestamp</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Command</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Response</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log, index) => (
              <tr key={index} className="border-t border-gray-200 dark:border-gray-700">
                <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">{log.timestamp}</td>
                <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">{log.command}</td>
                <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">{log.response}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}