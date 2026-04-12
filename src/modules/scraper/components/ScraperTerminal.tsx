import React from 'react';
import { Terminal } from 'lucide-react';

interface Log {
  time: string;
  text: string;
  type: 'info' | 'success' | 'error';
}

interface ScraperTerminalProps {
  logs: Log[];
  logsEndRef: React.RefObject<HTMLDivElement>;
}

export const ScraperTerminal: React.FC<ScraperTerminalProps> = ({ logs, logsEndRef }) => {
  return (
    <div className="bg-[#0D1117] rounded-2xl border border-slate-800 flex flex-col overflow-hidden h-[600px]">
      <div className="flex items-center gap-2 px-4 py-3 bg-slate-900/50 border-b border-slate-800">
        <Terminal className="w-4 h-4 text-slate-400" />
        <span className="text-sm font-mono text-slate-300">Terminal de Scraping</span>
        <div className="ml-auto flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50" />
          <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50" />
          <div className="w-3 h-3 rounded-full bg-emerald-500/20 border border-emerald-500/50" />
        </div>
      </div>
      
      <div className="flex-1 p-4 overflow-y-auto font-mono text-xs space-y-2 custom-scrollbar">
        {logs.length === 0 ? (
          <div className="text-slate-600 italic">Esperando inicio de proceso...</div>
        ) : (
          logs.map((log, i) => (
            <div key={i} className="flex gap-3">
              <span className="text-slate-600 shrink-0">[{log.time}]</span>
              <span className={`
                ${log.type === 'error' ? 'text-red-400' : ''}
                ${log.type === 'success' ? 'text-emerald-400' : ''}
                ${log.type === 'info' ? 'text-slate-300' : ''}
              `}>
                {log.text}
              </span>
            </div>
          ))
        )}
        <div ref={logsEndRef} />
      </div>
    </div>
  );
};
