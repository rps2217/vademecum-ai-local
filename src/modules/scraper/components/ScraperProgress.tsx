import React from 'react';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

interface ScraperProgressProps {
  isProcessing: boolean;
  progress: number;
  total: number;
  status: string;
}

export const ScraperProgress: React.FC<ScraperProgressProps> = ({ isProcessing, progress, total, status }) => {
  if (!isProcessing && progress === 0) return null;

  const percentage = total > 0 ? Math.round((progress / total) * 100) : 0;

  return (
    <div className="bg-brand-surface border border-slate-800 rounded-3xl p-6 mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {isProcessing ? (
            <Loader2 className="w-5 h-5 text-brand-primary animate-spin" />
          ) : progress === total ? (
            <CheckCircle2 className="w-5 h-5 text-brand-accent" />
          ) : (
            <AlertCircle className="w-5 h-5 text-amber-500" />
          )}
          <span className="font-bold text-white">{status}</span>
        </div>
        <span className="text-sm font-mono text-slate-500">{progress} / {total} ({percentage}%)</span>
      </div>
      
      <div className="w-full bg-slate-900 rounded-full h-3 overflow-hidden border border-slate-800">
        <div 
          className="bg-brand-primary h-full transition-all duration-500 ease-out shadow-[0_0_15px_rgba(59,130,246,0.5)]"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
