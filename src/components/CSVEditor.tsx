import React, { useState } from 'react';
import { Save } from 'lucide-react';

interface CSVEditorProps {
  headers: string[];
  data: Record<string, string>;
  onUpdateColumn: (column: string, value: string) => void;
}

export function CSVEditor({ headers, data, onUpdateColumn }: CSVEditorProps) {
  const [editingColumn, setEditingColumn] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  // Validate and parse data
  let validData: Record<string, string>;
  try {
    validData = typeof data === 'string' ? JSON.parse(data) : data;
  } catch (err) {
    console.error('Failed to parse data:', err);
    validData = {}; // Fallback to empty object
  }

  const handleEdit = (column: string) => {
    setEditingColumn(column);
    setEditValue(validData[column] || ''); // Fallback to empty string
  };

  const handleSave = () => {
    if (editingColumn) {
      onUpdateColumn(editingColumn, editValue);
      setEditingColumn(null);
    }
  };

  // Early exit for invalid data
  if (!headers || headers.length === 0 || !validData) {
    return <div className="text-gray-500">No valid data available</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead>
          <tr>
            {headers.map(header => (
              <th
                key={header}
                className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            {headers.map(header => (
              <td key={header} className="px-3 py-2 whitespace-nowrap text-sm">
                {editingColumn === header ? (
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="block w-full px-2 py-1 text-sm border rounded"
                      autoFocus
                    />
                    <button
                      onClick={handleSave}
                      className="p-1 text-green-600 hover:text-green-700"
                    >
                      <Save className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => handleEdit(header)}
                    className="w-full text-left hover:bg-gray-100 dark:hover:bg-gray-700 px-2 py-1 rounded"
                  >
                    {validData[header] ?? 'N/A'} {/* Fallback for missing values */}
                  </button>
                )}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}
