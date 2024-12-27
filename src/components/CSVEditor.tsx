import React from 'react';
import { LineChart } from 'lucide-react';

interface CSVEditorProps {
  headers: string[];
  selectedXAxis: string | null;
  selectedYAxis: string | null;
  onSelectXAxis: (header: string) => void;
  onSelectYAxis: (header: string) => void;
  onGenerateChart: () => void;
}

export function CSVEditor({
  headers,
  selectedXAxis,
  selectedYAxis,
  onSelectXAxis,
  onSelectYAxis,
  onGenerateChart,
}: CSVEditorProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 ">
      <div className="flex flex-col space-y-4">
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              X Axis
            </label>
            <select
              value={selectedXAxis || ''}
              onChange={(e) => onSelectXAxis(e.target.value)}
              className="block w-full px-3 py-2 bg-white text-gray-700 dark:text-gray-300 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select X Axis</option>
              {headers.map((header) => (
                <option key={header} value={header}>
                  {header}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Y Axis
            </label>
            <select
              value={selectedYAxis || ''}
              onChange={(e) => onSelectYAxis(e.target.value)}
              className="block w-full px-3 py-2 bg-white text-gray-700 dark:text-gray-300 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select Y Axis</option>
              {headers.map((header) => (
                <option key={header} value={header}>
                  {header}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={onGenerateChart}
            disabled={!selectedXAxis || !selectedYAxis}
            className="mt-6 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700   disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <LineChart className="h-5 w-5 mr-2" />
            Generate Chart
          </button>
        </div>
      </div>
    </div>
  );
}