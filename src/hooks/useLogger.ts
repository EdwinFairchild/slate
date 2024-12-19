import { useEffect, useCallback } from 'react';
import { Logger } from '../utils/logger';
import type { LogMessage } from '../types';

export function useLogger(onLog: (log: LogMessage) => void) {
  const handleLog = useCallback((type: 'info' | 'error', message: string) => {
    onLog({
      id: crypto.randomUUID(),
      type,
      message,
      timestamp: new Date().toISOString()
    });
  }, [onLog]);

  useEffect(() => {
    const logger = Logger.getInstance();
    logger.setLogCallback(handleLog);
    return logger.setupConsoleOverrides();
  }, [handleLog]);
}