import { useState, useEffect } from 'react';
import type { CSVData } from '../types/csv';

export function useCSVData(
  filePath: string | null,
  cachedData: CSVData | null,
  setCachedData: (data: CSVData) => void
) {
  const [headers, setHeaders] = useState<string[]>(cachedData?.headers || []);
  const [data, setData] = useState<Record<string, string>[]>(cachedData?.data || []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!filePath) return;

    // Skip loading if data is already cached for this file
    if (cachedData) {
      setHeaders(cachedData.headers);
      setData(cachedData.data);
      return;
    }

    async function loadCSV() {
      try {
        setLoading(true);
        setError(null);
        const result = await window.api.readCSV(filePath);
        setHeaders(result.headers);
        setData(result.data);
        setCachedData(result); // Cache the loaded data
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load CSV');
        console.error('Failed to load CSV:', err);
      } finally {
        setLoading(false);
      }
    }

    loadCSV();
  }, [filePath, cachedData, setCachedData]);

  const updateColumn = async (column: string, value: string) => {
    if (!filePath) return;

    const newData = data.map((row) => ({
      ...row,
      [column]: value,
    }));

    try {
      await window.api.writeCSV({
        filePath,
        headers,
        data: newData,
      });
      setData(newData);
      setCachedData({ headers, data: newData }); // Update the cached data
    } catch (err) {
      console.error('Failed to update CSV:', err);
      setError(err instanceof Error ? err.message : 'Failed to update CSV');
    }
  };

  return { headers, data, loading, error, updateColumn };
}
