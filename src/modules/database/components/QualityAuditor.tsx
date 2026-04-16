import React, { useState, useEffect } from 'react';
import { DataAuditorService, DatabaseHealthReport, AuditIssue } from '../../../services/DataAuditorService';
import { ShieldAlert, CheckCircle, AlertTriangle, Info, RefreshCw, BarChart3, Search } from 'lucide-react';
import { motion } from 'motion/react';

export const QualityAuditor: React.FC = () => {
  const [report, setReport] = useState<DatabaseHealthReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'critical' | 'warning'>('all');

  const runAudit = async () => {
    setIsLoading(true);
    const newReport = await DataAuditorService.generateReport();
    setReport(newReport);
    setIsLoading(false);
  };

  useEffect(() => {
    runAudit();
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <RefreshCw className="w-10 h-10 text-brand-primary animate-spin mb-4" />
        <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">Escaneando integridad clínica...</p>
      </div>
    );
  }

  if (!report) return null;

  const filteredIssues = report.issues.filter(i => 
    filter === 'all' ? true : i.severity === filter
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Resumen de Salud */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-brand-surface p-6 rounded-[2rem] border border-slate-800 flex flex-col items-center justify-center text-center">
          <div className="relative w-24 h-24 mb-4">
            <svg className="w-full h-full" viewBox="0 0 36 36">
              <path
                className="text-slate-800"
                strokeDasharray="100, 100"
                strokeWidth="3"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className={report.score > 80 ? 'text-emerald-500' : report.score > 50 ? 'text-amber-500' : 'text-rose-500'}
                strokeDasharray={`${report.score}, 100`}
                strokeWidth="3"
                stroke="currentColor"
                strokeLinecap="round"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl font-bold text-white">{report.score}%</span>
            </div>
          </div>
          <h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest">Health Score</h3>
          <p className="text-[10px] text-slate-500 mt-1">Integridad global de los datos</p>
        </div>

        <div className="bg-brand-surface p-6 rounded-[2rem] border border-slate-800 grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Total</p>
            <p className="text-2xl font-bold text-white">{report.totalProducts}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Verificados</p>
            <p className="text-2xl font-bold text-emerald-400">{report.verifiedProducts}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-brand-primary uppercase tracking-widest">Seguridad</p>
            <p className="text-2xl font-bold text-white">{report.safetyCompleteness}%</p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-rose-500 uppercase tracking-widest">Alertas</p>
            <p className="text-2xl font-bold text-rose-400">{report.issues.length}</p>
          </div>
        </div>

        <div className="bg-brand-surface p-6 rounded-[2rem] border border-slate-800">
          <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
            <BarChart3 className="w-3 h-3" /> Distribución
          </h3>
          <div className="space-y-2">
            {Object.entries(report.categoryDistribution).map(([cat, count]) => (
              <div key={cat} className="flex items-center justify-between gap-4">
                <span className="text-[10px] text-slate-400 truncate">{cat}</span>
                <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-brand-primary/40" 
                    style={{ width: `${(count / report.totalProducts) * 100}%` }}
                  />
                </div>
                <span className="text-[10px] font-bold text-slate-300">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Lista de Hallazgos */}
      <div className="bg-brand-surface rounded-[2.5rem] border border-slate-800 overflow-hidden">
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-5 h-5 text-brand-primary" />
            <h3 className="text-lg font-bold text-white">Hallazgos de Auditoría</h3>
          </div>
          <div className="flex bg-brand-bg p-1 rounded-xl border border-slate-800">
            <button 
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${filter === 'all' ? 'bg-slate-800 text-white' : 'text-slate-500'}`}
            >
              Todos
            </button>
            <button 
              onClick={() => setFilter('critical')}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${filter === 'critical' ? 'bg-rose-500/20 text-rose-400' : 'text-slate-500'}`}
            >
              Críticos
            </button>
          </div>
        </div>

        <div className="max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800">
          {filteredIssues.length > 0 ? (
            <div className="divide-y divide-slate-800">
              {filteredIssues.map((issue, i) => (
                <div key={`${issue.sku}-${i}`} className="p-4 flex items-start gap-4 hover:bg-slate-800/30 transition-colors">
                  <div className={`p-2 rounded-xl shrink-0 ${
                    issue.severity === 'critical' ? 'bg-rose-500/10 text-rose-400' :
                    issue.severity === 'warning' ? 'bg-amber-500/10 text-amber-400' :
                    'bg-blue-500/10 text-blue-400'
                  }`}>
                    {issue.severity === 'critical' ? <ShieldAlert className="w-4 h-4" /> :
                     issue.severity === 'warning' ? <AlertTriangle className="w-4 h-4" /> :
                     <Info className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-sm text-slate-200">{issue.nombre}</span>
                      <span className="text-[10px] font-mono text-slate-600 uppercase">{issue.sku}</span>
                    </div>
                    <p className="text-xs text-slate-500">{issue.message}</p>
                  </div>
                  <button className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-[10px] font-bold text-slate-400 transition-all border border-slate-700">
                    Corregir
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-20 text-center">
              <CheckCircle className="w-12 h-12 text-emerald-500/20 mx-auto mb-4" />
              <p className="text-slate-500 font-medium">No se encontraron problemas de integridad.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
