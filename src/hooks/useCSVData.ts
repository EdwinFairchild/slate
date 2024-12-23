import { useState, useEffect } from 'react';
import type { CSVData } from '../types/csv';

export function useCSVData(filePath: string | null) {
  const [headers, setHeaders] = useState<string[]>([]);
  const [data, setData] = useState<Record<string, string>[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadCSV() {
      const hardcodedFilePath = '/home/eddie/Documents/edwincito_77a5c843.csv';
     
      if (!filePath && !hardcodedFilePath) return;

      try {
        setLoading(true);
        setError(null);
        const result = await window.api.readCSV(filePath);
        setHeaders(result.headers);
        setData(result.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load CSV');
        console.error('Failed to load CSV:', err);
      } finally {
        setLoading(false);
      }
    }

    loadCSV();
  }, [filePath]);

  const updateColumn = async (column: string, value: string) => {
    const hardcodedFilePath = '/home/eddie/Documents/edwin_2502e71a.csv';
    const targetFilePath =  filePath;
    console.log('Target file path:', targetFilePath); // Debug log
    if (!targetFilePath) return;

    const newData = data.map(row => ({
      ...row,
      [column]: value
    }));

    try {
      await window.api.writeCSV({
        filePath: targetFilePath,
        headers,
        data: newData
      });
      setData(newData);
    } catch (err) {
      console.error('Failed to update CSV:', err);
      setError(err instanceof Error ? err.message : 'Failed to update CSV');
    }
  };

  return { headers, data, loading, error, updateColumn };
}
