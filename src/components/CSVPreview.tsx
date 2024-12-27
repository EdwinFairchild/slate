import React, { useState } from 'react';

export function CSVPreview({ headers, data, onApplyRegex, onUndoRegex }: CSVPreviewProps) {
  const [regexInputs, setRegexInputs] = useState<Record<string, string>>(
    Object.fromEntries(headers.map(header => [header, '']))
  );

  const handleRegexChange = (header: string, value: string) => {
    setRegexInputs(prev => ({ ...prev, [header]: value }));
  };

  const handleApplyRegex = (header: string) => {
    const regex = regexInputs[header];
    if (regex) {
      console.log('Applying regex:', regex, 'to column:', header); // Debug
      onApplyRegex(header, regex);
    } else {
      console.error('No regex entered for column:', header);
    }
  };

  const handleUndoRegex = (header: string) => {
    console.log('Undoing last regex for column:', header); // Debug
    onUndoRegex(header);
  };

  return (
    <div className="h-full overflow-auto">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="sticky top-0 bg-white dark:bg-gray-800">
          <tr>
            {headers.map((header, index) => (
              <th
                key={header}
                className={`px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider ${
                  index === 0 ? 'w-40' : 'w-auto'
                }`} // Adjust width for the first column
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {data.map((row, i) => (
            <tr key={i}>
              {headers.map((header, index) => (
                <td
                  key={header}
                  className={`px-3 py-2 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300 ${
                    index === 0 ? 'w-32' : 'w-auto'
                  }`} // Apply width adjustment for the first column
                >
                  {row[header]}
                </td>
              ))}
            </tr>
          ))}
          <tr>
            {headers.map((header, index) => (
              <td
                key={header}
                className={`px-3 py-2 whitespace-nowrap text-sm ${
                  index === 0 ? 'w-48' : index === 1 ? 'w-56' : 'w-auto'
                }`} // Apply width adjustment for the first column
              >
                <div className="flex space-x-2">
                  {/* Input for Regex */}
                  <input
                    type="text"
                    placeholder="regex"
                    value={regexInputs[header]}
                    onChange={e => handleRegexChange(header, e.target.value)}
                     className="block w-full h-9 px-3 rounded-lg border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
                  />
                  {/* Apply Button */}
                  <button
                    onClick={() => handleApplyRegex(header)}
                    className="px-2 py-1 text-sm rounded bg-blue-400 text-white hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 transition"
                  >
                    Apply
                  </button>
                </div>
                  {/* Undo Button */}
                    <button
                    onClick={() => handleUndoRegex(header)}
                    className="mt-2 w-full px-2 py-1 text-sm bg-gray-400 dark:bg-gray-600 text-white rounded hover:bg-blue-700 dark:hover:bg-blue-700 transition" // Adjust width for the first column
                    >
                    Undo
                    </button>
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}
