import React, { useState, useEffect } from 'react';
import { DataAuditorService, DatabaseHealthReport } from '../../../services/DataAuditorService';
import { 
  ShieldCheck, 
  Database, 
  Sparkles, 
  AlertCircle, 
  ArrowRight, 
  CheckCircle2,
  Activity,
  Zap
} from 'lucide-react';
import { motion } from 'motion/react';

interface InsightsDashboardProps {
  onNavigate: (tab: string) => void;
}

export const InsightsDashboard: React.FC<InsightsDashboardProps> = ({ onNavigate }) => {
  const [report, setReport] = useState<DatabaseHealthReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadReport = async () => {
      const newReport = await DataAuditorService.generateReport();
      setReport(newReport);
      setIsLoading(false);
    };
    loadReport();
  }, []);

  if (isLoading) return null;
  if (!report) return null;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Bienvenida y Score Principal */}
      <div className="relative overflow-hidden bg-gradient-to-br from-brand-surface to-brand-bg p-8 rounded-[2.5rem] border border-slate-800 shadow-2xl">
        <div className="absolute top-0 right-0 p-12 opacity-5">
          <Zap className="w-64 h-64 text-brand-primary" />
        </div>
        
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-4 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-primary/10 text-brand-primary rounded-full text-[10px] font-bold uppercase tracking-widest border border-brand-primary/20">
              <Activity className="w-3 h-3" /> Estado del Sistema
            </div>
            <h1 className="text-4xl font-black text-white tracking-tight">
              Tu Vademécum está al <span className="text-brand-primary">{report.score}%</span>
            </h1>
            <p className="text-slate-400 max-w-md leading-relaxed">
              Has verificado <span className="text-emerald-400 font-bold">{report.verifiedProducts}</span> de <span className="text-white font-bold">{report.totalProducts}</span> productos. 
              {report.score < 90 ? ' Aún hay registros que requieren tu validación profesional.' : ' ¡Excelente integridad de datos!'}
            </p>
            <div className="flex flex-wrap gap-3 justify-center md:justify-start">
              <button 
                onClick={() => onNavigate('search')}
                className="px-6 py-3 bg-brand-primary text-white rounded-2xl font-bold text-sm shadow-lg hover:bg-brand-primary/80 transition-all flex items-center gap-2"
              >
                Comenzar Consultoría <ArrowRight className="w-4 h-4" />
              </button>
              <button 
                onClick={() => onNavigate('database')}
                className="px-6 py-3 bg-slate-800 text-slate-300 rounded-2xl font-bold text-sm hover:bg-slate-700 transition-all border border-slate-700"
              >
                Gestionar Base de Datos
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 w-full md:w-auto">
            <div className="bg-brand-bg/50 p-6 rounded-3xl border border-slate-800/50 backdrop-blur-sm">
              <Database className="w-6 h-6 text-indigo-400 mb-2" />
              <p className="text-2xl font-black text-white">{report.totalProducts}</p>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Productos</p>
            </div>
            <div className="bg-brand-bg/50 p-6 rounded-3xl border border-slate-800/50 backdrop-blur-sm">
              <ShieldCheck className="w-6 h-6 text-emerald-400 mb-2" />
              <p className="text-2xl font-black text-white">{report.verifiedProducts}</p>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Verificados</p>
            </div>
            <div className="bg-brand-bg/50 p-6 rounded-3xl border border-slate-800/50 backdrop-blur-sm">
              <Sparkles className="w-6 h-6 text-brand-primary mb-2" />
              <p className="text-2xl font-black text-white">{report.safetyCompleteness}%</p>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Seguridad OK</p>
            </div>
            <div className="bg-brand-bg/50 p-6 rounded-3xl border border-slate-800/50 backdrop-blur-sm">
              <AlertCircle className="w-6 h-6 text-rose-400 mb-2" />
              <p className="text-2xl font-black text-white">{report.issues.length}</p>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Alertas</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tareas Pendientes y Distribución */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-brand-primary" /> Próximas Tareas
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {report.issues.slice(0, 4).map((issue, i) => (
              <div 
                key={i} 
                className="bg-brand-surface p-5 rounded-3xl border border-slate-800 hover:border-brand-primary/30 transition-all cursor-pointer group"
                onClick={() => onNavigate('database')}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className={`p-2 rounded-xl ${issue.severity === 'critical' ? 'bg-rose-500/10 text-rose-400' : 'bg-amber-500/10 text-amber-400'}`}>
                    <AlertCircle className="w-4 h-4" />
                  </div>
                  <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">{issue.sku}</span>
                </div>
                <h4 className="font-bold text-slate-200 mb-1 group-hover:text-brand-primary transition-colors">{issue.nombre}</h4>
                <p className="text-xs text-slate-500 line-clamp-2">{issue.message}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <h3 className="text-xl font-bold text-white">Especialidades</h3>
          <div className="bg-brand-surface p-6 rounded-[2.5rem] border border-slate-800 space-y-4">
            {Object.entries(report.categoryDistribution).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([cat, count]) => (
              <div key={cat} className="space-y-2">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-400">{cat}</span>
                  <span className="text-white">{count}</span>
                </div>
                <div className="h-1.5 bg-brand-bg rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-brand-primary/60 rounded-full" 
                    style={{ width: `${(count / report.totalProducts) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
