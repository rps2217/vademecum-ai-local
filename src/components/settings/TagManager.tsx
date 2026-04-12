import React, { useState, useEffect } from 'react';
import { Tag, Search, RefreshCw, Trash2, CheckCircle, AlertCircle, Loader2, X } from 'lucide-react';
import { getDB } from '../../core/database/db';
import { TagIntelligenceService } from '../../services/TagIntelligenceService';

interface TagMapping {
  raw: string;
  normalized: string;
  last_updated: number;
}

export const TagManager: React.FC = () => {
  const [mappings, setMappings] = useState<TagMapping[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isNormalizing, setIsNormalizing] = useState(false);
  const [editingRaw, setEditingRaw] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const loadMappings = async () => {
    setIsLoading(true);
    try {
      const db = await getDB();
      const all = await db.getAll('tag_mappings');
      setMappings(all.sort((a, b) => b.last_updated - a.last_updated));
    } catch (error) {
      console.error('Error cargando mapeos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMappings();
  }, []);

  const handleSaveEdit = async (raw: string) => {
    if (!editValue.trim()) return;
    const db = await getDB();
    const mapping = {
      raw,
      normalized: editValue.trim(),
      last_updated: Date.now()
    };
    await db.put('tag_mappings', mapping);
    setEditingRaw(null);
    loadMappings();
  };

  const handleDelete = async (raw: string) => {
    if (!confirm(`¿Eliminar el mapeo para "${raw}"?`)) return;
    const db = await getDB();
    await db.delete('tag_mappings', raw);
    loadMappings();
  };

  const filteredMappings = mappings.filter(m => 
    m.raw.toLowerCase().includes(searchTerm.toLowerCase()) || 
    m.normalized.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden">
      <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500/10 rounded-lg">
            <Tag className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Diccionario de Etiquetas Inteligentes</h3>
            <p className="text-xs text-slate-500">Normalización semántica de categorías y términos.</p>
          </div>
        </div>
        <button 
          onClick={loadMappings}
          className="p-2 hover:bg-slate-800 rounded-xl transition-colors text-slate-400"
          title="Refrescar"
        >
          <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="p-4 bg-slate-950/50 border-b border-slate-800">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input 
            type="text"
            placeholder="Buscar etiquetas o mapeos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 pl-10 pr-4 text-sm text-slate-300 focus:border-indigo-500 transition-all outline-none"
          />
        </div>
      </div>

      <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-500">
            <Loader2 className="w-8 h-8 animate-spin mb-2" />
            <span className="text-sm">Cargando diccionario...</span>
          </div>
        ) : filteredMappings.length === 0 ? (
          <div className="py-12 text-center text-slate-600 italic text-sm">
            No se encontraron mapeos de etiquetas.
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-900/30">
              <tr>
                <th className="px-6 py-3">Término Original</th>
                <th className="px-6 py-3">Concepto Normalizado</th>
                <th className="px-6 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {filteredMappings.map((m) => (
                <tr key={m.raw} className="hover:bg-slate-800/30 transition-colors group">
                  <td className="px-6 py-4">
                    <span className="text-slate-400 font-mono text-xs">{m.raw}</span>
                  </td>
                  <td className="px-6 py-4">
                    {editingRaw === m.raw ? (
                      <div className="flex items-center gap-2">
                        <input 
                          autoFocus
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit(m.raw)}
                          className="bg-slate-800 border border-indigo-500 rounded px-2 py-1 text-white text-sm outline-none w-full"
                        />
                        <button 
                          onClick={() => handleSaveEdit(m.raw)}
                          className="p-1 text-emerald-500 hover:bg-emerald-500/10 rounded"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => setEditingRaw(null)}
                          className="p-1 text-slate-500 hover:bg-slate-500/10 rounded"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div 
                        className="flex items-center gap-2 cursor-pointer group/item"
                        onClick={() => {
                          setEditingRaw(m.raw);
                          setEditValue(m.normalized);
                        }}
                      >
                        <CheckCircle className="w-3 h-3 text-emerald-500" />
                        <span className="text-slate-200 font-bold">{m.normalized}</span>
                        <span className="text-[10px] text-indigo-400 opacity-0 group-hover/item:opacity-100 transition-opacity ml-2">Editar</span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => handleDelete(m.raw)}
                      className="p-2 text-slate-600 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="p-4 bg-slate-900/50 border-t border-slate-800 flex items-center gap-3">
        <AlertCircle className="w-4 h-4 text-slate-500 shrink-0" />
        <p className="text-[10px] text-slate-500 leading-relaxed">
          El motor de IA agrupa automáticamente etiquetas similares. Puedes eliminar mapeos incorrectos para que la IA intente una nueva normalización la próxima vez.
        </p>
      </div>
    </div>
  );
};
