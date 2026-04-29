
import { useState, useEffect } from 'react';
import { LogService, LogEntry } from '../services/LogService';
import { EventBus, EventType } from '../services/EventBus';

export const useLogs = () => {
  const [logs, setLogs] = useState<LogEntry[]>(LogService.getLogs());

  useEffect(() => {
    const sub = EventBus.on(EventType.LOG_ADDED as any).subscribe(() => {
      setLogs([...LogService.getLogs()]);
    });

    return () => sub.unsubscribe();
  }, []);

  return { logs, clearLogs: () => LogService.clear() };
};
