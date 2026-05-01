
import { useState, useEffect } from 'react';
import { logger } from '../services/LoggerService';
import { LogEntry } from '../core/types';

export const useLogs = () => {
  const [logs, setLogs] = useState<LogEntry[]>(logger.getLogs());

  useEffect(() => {
    const handleLog = () => {
      setLogs([...logger.getLogs()]);
    };

    window.addEventListener('app_log', handleLog);
    return () => window.removeEventListener('app_log', handleLog);
  }, []);

  return { logs, clearLogs: () => logger.clear() };
};
