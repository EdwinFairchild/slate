import React from 'react';

interface CSVPreviewProps {
  headers: string[];
  data: Record<string, string>[];
}

export function CSVPreview({ headers, data }: CSVPreviewProps) {
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
        </tbody>
      </table>
    </div>
  );
}