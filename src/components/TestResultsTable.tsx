import React from 'react';
import { format } from 'date-fns';
import { Activity, XCircle, CheckCircle2, PlayCircle, StopCircle } from 'lucide-react';
import type { TestResult } from '../types/test';

interface TestResultsTableProps {
  tests: TestResult[];
  onStopTest: (testId: string) => void;
  onRerunTest: (testId: string) => void;
}

export function TestResultsTable({ tests, onStopTest, onRerunTest }: TestResultsTableProps) {
  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'running':
        return <Activity className="h-5 w-5 text-blue-500 animate-pulse" />;
      case 'completed':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      {tests.length === 0 ? (
        <p className="text-center text-gray-500">No tests available.</p>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  #
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Test Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Test ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Start Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Duration
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {tests.map((test, index) => (
                <tr key={test.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {index + 1}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{getStatusIcon(test.status)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {test.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {test.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {format(new Date(test.startTime), 'MMM d, HH:mm:ss')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {test.endTime
                      ? `${Math.round(
                          (new Date(test.endTime).getTime() -
                            new Date(test.startTime).getTime()) /
                            1000
                        )}s`
                      : 'Running...'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 space-x-2">
                    {test.status === 'running' ? (
                      <button
                        onClick={() => onStopTest(test.id)}
                        className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-900 hover:bg-red-200 dark:hover:bg-red-800 transition-colors"
                      >
                        <StopCircle className="h-4 w-4 mr-1" />
                        Stop
                      </button>
                    ) : (
                      <button
                        onClick={() => onRerunTest(test.id)}
                        className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-blue-700 dark:text-blue-400 bg-blue-100 dark:bg-blue-900 hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                      >
                        <PlayCircle className="h-4 w-4 mr-1" />
                        Rerun
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
