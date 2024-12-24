import React, { useState } from 'react';
export function CSVPreview({ headers, data, onApplyRegex }: CSVPreviewProps) {
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

  return (
    <div className="h-full overflow-auto">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="sticky top-0 bg-white dark:bg-gray-800">
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
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {data.map((row, i) => (
            <tr key={i}>
              {headers.map(header => (
                <td
                  key={header}
                  className="px-3 py-2 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300"
                >
                  {row[header]}
                </td>
              ))}
            </tr>
          ))}
          <tr>
            {headers.map(header => (
              <td key={header} className="px-3 py-2 whitespace-nowrap text-sm">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    placeholder="Enter regex"
                    value={regexInputs[header]}
                    onChange={e => handleRegexChange(header, e.target.value)}
                    className="block w-full px-2 py-1 text-sm border rounded"
                  />
                  <button
                    onClick={() => handleApplyRegex(header)}
                    className="px-2 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    Apply
                  </button>
                </div>
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}
