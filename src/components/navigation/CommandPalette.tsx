import React, { useState, useEffect, useCallback } from 'react';
import { Search, Database, Cpu, Globe, Settings, X, Command, ChevronRight, Sparkles, AlertCircle } from 'lucide-react';
import { useProductSearch } from '../../hooks/useProductSearch';
import { Product } from '../../core/types/product.types';
import { motion, AnimatePresence } from 'motion/react';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProduct: (product: Product) => void;
  onNavigate: (tab: any) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose, onSelectProduct, onNavigate }) => {
  const [search, setSearch] = useState('');
  const { setQuery, results, isSearching } = useProductSearch();
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Actualizar búsqueda con debounce natural del hook
  useEffect(() => {
    setQuery(search);
    setSelectedIndex(0);
  }, [search, setQuery]);

  // Manejo de teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, results.length + 4)); // +4 por las acciones fijas
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        handleSelect(selectedIndex);
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, results, selectedIndex, onClose]);

  const handleSelect = (index: number) => {
    // Acciones fijas (0-4)
    if (index === 0) onNavigate('search');
    else if (index === 1) onNavigate('database');
    else if (index === 2) onNavigate('ai-engine');
    else if (index === 3) onNavigate('scraper');
    else if (index === 4) onNavigate('settings');
    // Resultados de productos (index > 4)
    else if (results[index - 5]) {
      onSelectProduct(results[index - 5]);
      onClose();
    }
  };

  if (!isOpen) return null;

  const actions = [
    { id: 'search', label: 'Ir al Buscador', icon: Search, tab: 'search' },
    { id: 'database', label: 'Gestionar Base de Datos', icon: Database, tab: 'database' },
    { id: 'ai-engine', label: 'Configurar Motores IA', icon: Cpu, tab: 'ai-engine' },
    { id: 'scraper', label: 'Importar/Scrapear Datos', icon: Globe, tab: 'scraper' },
    { id: 'settings', label: 'Ajustes del Sistema', icon: Settings, tab: 'settings' },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4 bg-brand-bg/80 backdrop-blur-md" onClick={onClose}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: -20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -20 }}
        className="w-full max-w-2xl bg-brand-surface border border-slate-800 rounded-[2rem] shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Input de Búsqueda */}
        <div className="relative border-b border-slate-800 p-6">
          <Search className="absolute left-8 top-1/2 -translate-y-1/2 w-6 h-6 text-brand-primary" />
          <input
            autoFocus
            type="text"
            placeholder="Busca productos, síntomas, componentes o comandos..."
            className="w-full bg-transparent pl-12 pr-4 py-2 text-xl text-white outline-none placeholder:text-slate-600 font-medium"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <div className="absolute right-8 top-1/2 -translate-y-1/2 flex items-center gap-2">
            <span className="px-2 py-1 rounded-md bg-slate-800 text-[10px] font-bold text-slate-500 border border-slate-700">ESC</span>
          </div>
        </div>

        {/* Resultados */}
        <div className="max-h-[60vh] overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-slate-800">
          
          {/* Sección de Acciones Rápidas (Solo si no hay búsqueda larga) */}
          {search.length < 2 && (
            <div className="mb-6">
              <h3 className="px-4 mb-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Navegación Rápida</h3>
              <div className="space-y-1">
                {actions.map((action, i) => (
                  <button
                    key={action.id}
                    onClick={() => onNavigate(action.tab)}
                    className={`w-full flex items-center gap-4 px-4 py-3 rounded-2xl transition-all ${
                      selectedIndex === i ? 'bg-brand-primary/10 text-brand-primary border border-brand-primary/20' : 'text-slate-400 hover:bg-slate-800/50 border border-transparent'
                    }`}
                  >
                    <action.icon className="w-5 h-5" />
                    <span className="font-bold text-sm">{action.label}</span>
                    {selectedIndex === i && <ChevronRight className="ml-auto w-4 h-4" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Resultados de Productos */}
          <div>
            <div className="flex items-center justify-between px-4 mb-2">
              <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                {search.length > 0 ? 'Resultados del Vademécum' : 'Productos Recientes'}
              </h3>
              {isSearching && <Sparkles className="w-3 h-3 text-brand-primary animate-pulse" />}
            </div>

            {results.length > 0 ? (
              <div className="space-y-1">
                {results.map((product, i) => {
                  const index = search.length < 2 ? i + 5 : i;
                  return (
                    <button
                      key={product.sku}
                      onClick={() => {
                        onSelectProduct(product);
                        onClose();
                      }}
                      className={`w-full flex items-center gap-4 px-4 py-3 rounded-2xl transition-all text-left ${
                        selectedIndex === index ? 'bg-brand-primary/10 text-brand-primary border border-brand-primary/20' : 'text-slate-400 hover:bg-slate-800/50 border border-transparent'
                      }`}
                    >
                      <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center font-bold text-[10px] text-slate-500 overflow-hidden border border-slate-700">
                        {product.sku.substring(0, 3)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-sm text-slate-200 truncate">{product.nombre_comercial}</div>
                        <div className="text-[10px] text-slate-500 truncate">{product.principios_activos.join(', ')}</div>
                      </div>
                      {selectedIndex === index && (
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold uppercase tracking-tighter opacity-50">Abrir Ficha</span>
                          <ChevronRight className="w-4 h-4" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            ) : search.length > 0 && !isSearching ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-600">
                <AlertCircle className="w-12 h-12 mb-4 opacity-20" />
                <p className="font-medium">No se encontraron coincidencias para "{search}"</p>
              </div>
            ) : null}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-900/50 border-t border-slate-800 p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px] text-slate-400">↑↓</kbd>
              <span className="text-[10px] text-slate-500 font-medium uppercase">Navegar</span>
            </div>
            <div className="flex items-center gap-1.5">
              <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px] text-slate-400">ENTER</kbd>
              <span className="text-[10px] text-slate-500 font-medium uppercase">Seleccionar</span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-brand-primary/40">
            <Command className="w-3 h-3" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Vademécum Pro</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
