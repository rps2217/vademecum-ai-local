import React from 'react';
import { useBatchScraper } from '../../hooks/useBatchScraper';
import { ScraperHeader } from './components/ScraperHeader';
import { ScraperConfig } from './components/ScraperConfig';
import { ScraperTerminal } from './components/ScraperTerminal';

export const BatchScraper: React.FC = () => {
  const {
    targetUrl,
    setTargetUrl,
    logs,
    isRunning,
    logsEndRef,
    startScraping,
    stopScraping
  } = useBatchScraper();

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <ScraperHeader />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Panel de Configuración */}
        <div className="lg:col-span-5 space-y-6">
          <ScraperConfig 
            targetUrl={targetUrl}
            setTargetUrl={setTargetUrl}
            isRunning={isRunning}
            onStart={startScraping}
            onStop={stopScraping}
          />
        </div>

        {/* Terminal / Logs */}
        <div className="lg:col-span-7">
          <ScraperTerminal 
            logs={logs}
            logsEndRef={logsEndRef}
          />
        </div>
      </div>
    </div>
  );
};


