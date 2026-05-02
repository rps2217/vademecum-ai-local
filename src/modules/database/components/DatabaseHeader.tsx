import React from 'react';
import { Database, CloudUpload, FileUp, Download, RefreshCw } from 'lucide-react';

interface DatabaseHeaderProps {
  isAdmin: boolean;
  isSyncing: boolean;
  onShowScraper: () => void;
  onImportClick: () => void;
  onExport: () => void;
  onSmartPull: () => void;
  onSyncToCloud: () => void;
}

export const DatabaseHeader: React.FC<DatabaseHeaderProps> = ({
  isAdmin,
  isSyncing,
  onShowScraper,
  onImportClick,
  onExport,
  onSmartPull,
  onSyncToCloud
}) => (
  <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 sm:mb-8 gap-4 sm:gap-6">
    <div className="flex items-center gap-3">
      <div className="p-2 sm:p-3 bg-brand-primary/10 rounded-xl sm:rounded-2xl">
        <Database className="w-6 h-6 sm:w-8 sm:h-8 text-brand-primary" />
      </div>
      <div>
        <h2 className="text-xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight">Base de Datos</h2>
        <p className="text-slate-400 font-medium text-[10px] sm:text-sm uppercase tracking-widest opacity-60">Gestión de Inventario</p>
      </div>
    </div>
    
    <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 sm:gap-3">
      {isAdmin && (
        <button onClick={onShowScraper} className="flex items-center justify-center gap-2 px-3 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl transition-all font-bold text-[10px] sm:text-sm shadow-lg shadow-indigo-500/20 whitespace-nowrap">
          <CloudUpload className="w-3.5 h-3.5 sm:w-4 h-4" /> <span>Scraper IA</span>
        </button>
      )}
      <button onClick={onImportClick} className="flex items-center justify-center gap-2 px-3 py-2 bg-brand-surface border border-slate-700 text-white rounded-xl hover:bg-slate-800 transition-all font-bold text-[10px] sm:text-sm whitespace-nowrap">
        <FileUp className="w-3.5 h-3.5 sm:w-4 h-4 text-brand-primary" /> <span>Importar</span>
      </button>
      <button onClick={onExport} className="flex items-center justify-center gap-2 px-3 py-2 bg-brand-surface border border-slate-700 text-white rounded-xl hover:bg-slate-800 transition-all font-bold text-[10px] sm:text-sm whitespace-nowrap">
        <Download className="w-3.5 h-3.5 sm:w-4 h-4 text-emerald-400" /> <span>Exportar</span>
      </button>
      {isAdmin && (
        <>
          <button 
            onClick={onSmartPull} 
            disabled={isSyncing} 
            className="flex items-center justify-center gap-2 px-3 py-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-xl hover:bg-indigo-500/20 transition-all font-bold text-[10px] sm:text-sm disabled:opacity-50 whitespace-nowrap"
            title="Descarga solo lo que falta en tu base local"
          >
            <RefreshCw className={`w-3.5 h-3.5 sm:w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} /> <span>Sync Cloud</span>
          </button>
          <button onClick={onSyncToCloud} disabled={isSyncing} className="hidden sm:flex items-center justify-center gap-2 px-3 py-2 bg-brand-primary text-white rounded-xl hover:opacity-90 font-bold text-[10px] sm:text-sm disabled:opacity-50 whitespace-nowrap">
            <CloudUpload className={`w-3.5 h-3.5 sm:w-4 h-4 ${isSyncing ? 'animate-bounce' : ''}`} /> <span>Backup</span>
          </button>
        </>
      )}
    </div>
  </div>
);
