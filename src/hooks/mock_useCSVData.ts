import { useState, useEffect } from 'react';
import type { CSVData } from '../types/csv';

export function useCSVData(filePath: string | null) {
  const [headers, setHeaders] = useState<string[]>([]);
  const [data, setData] = useState<Record<string, string>[]>([]);

  useEffect(() => {
    if (filePath) {
      // Mock data for now - will be replaced with actual file reading
      const mockHeaders = ['Date', 'Value', 'Category', 'Notes'];
      const mockData = Array.from({ length: 50 }, (_, i) => ({
        Date: `2024-03-${String(i + 1).padStart(2, '0')}`,
        Value: String(Math.random() * 100),
        Category: ['A', 'B', 'C'][Math.floor(Math.random() * 3)],
        Notes: `Note ${i + 1}`
      }));

      setHeaders(mockHeaders);
      setData(mockData);
    }
  }, [filePath]);

  const updateColumn = (column: string, value: string) => {
    setData(prev => prev.map(row => ({
      ...row,
      [column]: value
    })));
  };

  return { headers, data, updateColumn };
}