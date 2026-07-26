/**
 * Vademecum AI - Dashboard V2
 * Diseño híbrido: basado en AppSimple con funcionalidades mejoradas
 */

import React, { useState, useEffect, useMemo } from 'react';
import { getCombinedKnowledgeBase, getIngredientCount } from './core/knowledge-base';
import { synergyGraphService } from './core/knowledge-base/SynergyGraph';
import { Product } from './core/types/product.types';
import { supabaseService } from './services/SupabaseService';
import { logger } from './services/LoggerService';

// Iconos
const SearchIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const SettingsIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const DatabaseIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
  </svg>
);

const PlayIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const StopIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
  </svg>
);

const CloudIcon = ({ connected }: { connected: boolean }) => (
  <div className="flex items-center gap-2">
    <div className={`w-3 h-3 rounded-full ${connected ? 'bg-emerald-400' : 'bg-yellow-400'} ${connected ? 'animate-pulse' : ''}`} />
    <span className="text-sm font-medium">{connected ? 'Nube' : 'Local'}</span>
  </div>
);

// Tipos
interface AnalyzedProduct extends Product {
  ingredientes_encontrados: string[];
  cobertura_kb: number;
  sinergias_detectadas: string[];
}

type ViewType = 'productos' | 'sinergias' | 'stats' | 'catalogo' | 'ajustes';

// ==================== HELPERS ====================

function analyzeProduct(product: Product, kb: Record<string, any>): { found: string[]; sinergias: string[] } {
  const found: string[] = [];
  const principios = (product.principios_activos || []).map(p => String(p).toLowerCase());
  
  for (const [id, ing] of Object.entries(kb)) {
    const ingName = String((ing as any).nombre).toLowerCase();
    for (const principio of principios) {
      if (principio.includes(ingName) || ingName.includes(principio)) {
        if (!found.includes(id)) found.push(id);
      }
    }
  }

  const sinergias: string[] = [];
  for (const id of found) {
    const sin = synergyGraphService.obtenerSinergiasDe(id);
    for (const s of sin) {
      if (found.includes(s.hacia)) {
        const key = [id, s.hacia].sort().join('+');
        if (!sinergias.some(x => x.includes(key))) {
          sinergias.push(`${id} + ${s.hacia}`);
        }
      }
    }
  }

  return { found, sinergias };
}

// ==================== COMPONENTES ====================

function Header({ 
  productCount, 
  connected, 
  onSearch,
  onOpenAjustes 
}: { 
  productCount: number; 
  connected: boolean;
  onSearch: (q: string) => void;
  onOpenAjustes: () => void;
}) {
  const [searchValue, setSearchValue] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchValue);
  };

  return (
    <header className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur">
              <span className="text-xl">💊</span>
            </div>
            <div>
              <h1 className="text-xl font-bold">Vademecum AI</h1>
              <p className="text-xs text-emerald-100 opacity-80">
                {productCount} productos • {getIngredientCount()} ingredientes KB
              </p>
            </div>
          </div>

          {/* Search */}
          <form onSubmit={handleSearch} className="flex-1 max-w-xl hidden sm:block">
            <div className="relative">
              <input
                type="text"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder="Buscar producto, ingrediente..."
                className="w-full pl-10 pr-4 py-2.5 bg-white/20 backdrop-blur rounded-xl text-white placeholder-emerald-200 border border-white/20 focus:bg-white/30 focus:border-white/40 outline-none transition-all"
              />
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-200">
                <SearchIcon />
              </div>
            </div>
          </form>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <CloudIcon connected={connected} />
            <button 
              onClick={onOpenAjustes}
              className="p-2.5 bg-white/20 hover:bg-white/30 rounded-xl backdrop-blur transition-all"
              title="Ajustes"
            >
              <SettingsIcon />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

function LoadingState({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600 font-medium">{message}</p>
      </div>
    </div>
  );
}

function TabNav({ active, onChange, productCount }: { active: ViewType; onChange: (v: ViewType) => void; productCount: number }) {
  const tabs: { id: ViewType; label: string; icon: React.ReactNode }[] = [
    { id: 'productos', label: `Productos (${productCount})`, icon: <span>📦</span> },
    { id: 'sinergias', label: 'Sinergias', icon: <span>🔗</span> },
    { id: 'stats', label: 'Estadísticas', icon: <span>📊</span> },
    { id: 'catalogo', label: 'Catálogo', icon: <DatabaseIcon /> },
    { id: 'ajustes', label: 'Ajustes', icon: <SettingsIcon /> },
  ];

  return (
    <nav className="bg-white border-b sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex gap-1 overflow-x-auto py-2">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                active === tab.id 
                  ? 'bg-emerald-600 text-white shadow-md' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
}

function CategoryFilter({ 
  categories, 
  selected, 
  onSelect 
}: { 
  categories: string[]; 
  selected: string; 
  onSelect: (cat: string) => void;
}) {
  return (
    <div className="px-4 py-3 bg-gray-50 border-b">
      <div className="max-w-7xl mx-auto flex flex-wrap gap-2">
        <button
          onClick={() => onSelect('todas')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            selected === 'todas' 
              ? 'bg-emerald-600 text-white' 
              : 'bg-white border text-gray-700 hover:border-emerald-400'
          }`}
        >
          Todas
        </button>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => onSelect(cat)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
              selected === cat 
                ? 'bg-emerald-600 text-white' 
                : 'bg-white border text-gray-700 hover:border-emerald-400'
            }`}
          >
            {cat.replace(/_/g, ' ')}
          </button>
        ))}
      </div>
    </div>
  );
}

function ProductCard({ 
  product, 
  kb,
  onClick 
}: { 
  product: any; 
  kb: Record<string, any>;
  onClick: () => void;
}) {
  const ingNames = product.ingredientes_encontrados?.map((id: string) => kb[id]?.nombre).filter(Boolean) || [];
  const sinCount = product.sinergias_detectadas?.length || 0;

  return (
    <div
      onClick={onClick}
      className="bg-white border border-gray-200 rounded-xl p-4 cursor-pointer hover:border-emerald-500 hover:shadow-lg transition-all group"
    >
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-semibold text-gray-900 line-clamp-1 group-hover:text-emerald-700 transition-colors">
          {product.nombre_comercial || product.sku}
        </h3>
        {product.cobertura_kb > 0 && (
          <span className={`text-xs px-2 py-1 rounded-full font-medium ${
            product.cobertura_kb >= 50 
              ? 'bg-emerald-100 text-emerald-700' 
              : 'bg-gray-100 text-gray-600'
          }`}>
            {product.cobertura_kb}%
          </span>
        )}
      </div>
      
      <p className="text-sm text-gray-500 line-clamp-2 mb-3">
        {product.descripcion || 'Sin descripción disponible'}
      </p>
      
      <div className="flex flex-wrap gap-1 mb-2">
        {ingNames.slice(0, 3).map((name: string, i: number) => (
          <span key={i} className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full">
            {name.split(' ')[0]}
          </span>
        ))}
        {ingNames.length > 3 && (
          <span className="text-xs text-gray-400">+{ingNames.length - 3}</span>
        )}
      </div>
      
      {sinCount > 0 && (
        <div className="flex items-center gap-1 text-xs text-emerald-600">
          <span>🔗</span>
          <span className="font-medium">+{sinCount} sinergia{sinCount > 1 ? 's' : ''}</span>
        </div>
      )}
    </div>
  );
}

function IngredientDetail({ 
  ingredient, 
  onClose 
}: { 
  ingredient: any; 
  onClose: () => void;
}) {
  const sinergias = synergyGraphService.obtenerSinergiasDe(ingredient.id);
  const antagonismos = synergyGraphService.obtenerAntagonismosDe(ingredient.id);
  
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div 
        className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6 border-b sticky top-0 bg-white rounded-t-2xl">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{ingredient.nombre}</h2>
              <span className="text-sm bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full mt-2 inline-block capitalize">
                {ingredient.categoria?.replace(/_/g, ' ')}
              </span>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500"
            >
              ✕
            </button>
          </div>
        </div>
        
        <div className="p-6 space-y-6">
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Descripción</h3>
            <p className="text-gray-700 leading-relaxed">{ingredient.descripcion}</p>
          </div>
          
          {ingredient.mecanismo_accion && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Mecanismo de Acción</h3>
              <p className="text-gray-700 leading-relaxed">{ingredient.mecanismo_accion}</p>
            </div>
          )}
          
          {ingredient.beneficios?.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Beneficios</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {ingredient.beneficios.map((b: string, i: number) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-gray-700 bg-emerald-50 p-2 rounded-lg">
                    <span className="text-emerald-600">✓</span> {b}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {ingredient.dosis_recomendada && (
            <div className="bg-blue-50 p-4 rounded-xl">
              <h3 className="font-semibold text-blue-900 mb-1">Dosis Recomendada</h3>
              <p className="text-blue-800">{ingredient.dosis_recomendada}</p>
            </div>
          )}
          
          {sinergias.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <span>🔗</span> Sinergias ({sinergias.length})
              </h3>
              <div className="space-y-2">
                {sinergias.map((syn: any) => (
                  <div key={syn.id} className="bg-emerald-50 p-3 rounded-xl flex justify-between items-center">
                    <div>
                      <span className="font-medium text-gray-900">{syn.hacia}</span>
                      <p className="text-sm text-gray-600">{syn.descripcion}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      syn.nivel === 'alto' ? 'bg-emerald-600 text-white' :
                      syn.nivel === 'medio' ? 'bg-yellow-500 text-white' :
                      'bg-gray-400 text-white'
                    }`}>
                      {syn.nivel}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {antagonismos.length > 0 && (
            <div>
              <h3 className="font-semibold text-red-900 mb-3 flex items-center gap-2">
                <span>⚠️</span> Precaución - Antagonismos ({antagonismos.length})
              </h3>
              <div className="space-y-2">
                {antagonismos.map((ant: any) => (
                  <div key={ant.id} className="bg-red-50 p-3 rounded-xl">
                    <span className="font-medium text-gray-900">{ant.hacia}</span>
                    <p className="text-sm text-red-700">{ant.descripcion}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatsView({ kb, categories }: { kb: Record<string, any>; categories: string[] }) {
  const stats = synergyGraphService.obtenerEstadisticas();
  
  return (
    <main className="max-w-7xl mx-auto p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">📊 Estadísticas</h2>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white border rounded-xl p-4 text-center">
          <div className="text-3xl font-bold text-emerald-600">{getIngredientCount()}</div>
          <div className="text-sm text-gray-500">Ingredientes KB</div>
        </div>
        <div className="bg-white border rounded-xl p-4 text-center">
          <div className="text-3xl font-bold text-emerald-600">{stats.sinergiasTotales}</div>
          <div className="text-sm text-gray-500">Sinergias</div>
        </div>
        <div className="bg-white border rounded-xl p-4 text-center">
          <div className="text-3xl font-bold text-red-600">{stats.antagonismosTotales}</div>
          <div className="text-sm text-gray-500">Antagonismos</div>
        </div>
        <div className="bg-white border rounded-xl p-4 text-center">
          <div className="text-3xl font-bold text-blue-600">{categories.length}</div>
          <div className="text-sm text-gray-500">Categorías</div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white border rounded-xl p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Top Ingredientes</h3>
          <div className="space-y-2">
            {Object.entries(kb).slice(0, 5).map(([id, ing]: [string, any]) => {
              const sinCount = synergyGraphService.obtenerSinergiasDe(id).length;
              return (
                <div key={id} className="flex justify-between items-center p-2 hover:bg-gray-50 rounded">
                  <span className="font-medium text-gray-800">{ing.nombre}</span>
                  <span className="text-sm text-emerald-600">{sinCount} sinergias</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white border rounded-xl p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Distribución por Categoría</h3>
          <div className="space-y-3">
            {categories.map(cat => {
              const count = Object.values(kb).filter((i: any) => i.categoria === cat).length;
              const pct = Math.round((count / Object.keys(kb).length) * 100) || 0;
              return (
                <div key={cat}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="capitalize text-gray-700">{cat.replace(/_/g, ' ')}</span>
                    <span className="text-gray-500">{count} ({pct}%)</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-emerald-500 rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </main>
  );
}

function SynergyFinder({ kb }: { kb: Record<string, any> }) {
  const [ing1, setIng1] = useState('');
  const [ing2, setIng2] = useState('');
  const [result, setResult] = useState<any>(null);

  const findSynergy = () => {
    if (!ing1 || !ing2) return;
    
    const sin = synergyGraphService.obtenerSinergiasDe(ing1.toLowerCase());
    const found = sin.find((s: any) => s.hacia.toLowerCase().includes(ing2.toLowerCase()));
    
    if (found) {
      setResult({ type: 'sinergia', data: found });
    } else {
      const ant = synergyGraphService.obtenerAntagonismosDe(ing1.toLowerCase());
      const foundAnt = ant.find((a: any) => a.hacia.toLowerCase().includes(ing2.toLowerCase()));
      if (foundAnt) {
        setResult({ type: 'antagonismo', data: foundAnt });
      } else {
        setResult({ type: 'ninguna', data: null });
      }
    }
  };

  return (
    <main className="max-w-3xl mx-auto p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">🔗 Buscador de Sinergias</h2>
      
      <div className="bg-white border rounded-xl p-6">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Ingrediente 1</label>
            <input
              type="text"
              value={ing1}
              onChange={(e) => setIng1(e.target.value)}
              placeholder="Ej: Vitamina C"
              className="w-full px-4 py-2.5 border rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Ingrediente 2</label>
            <input
              type="text"
              value={ing2}
              onChange={(e) => setIng2(e.target.value)}
              placeholder="Ej: Zinc"
              className="w-full px-4 py-2.5 border rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none"
            />
          </div>
        </div>
        
        <button
          onClick={findSynergy}
          className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl transition-colors"
        >
          Buscar Relación
        </button>
        
        {result && (
          <div className={`mt-6 p-4 rounded-xl ${
            result.type === 'sinergia' ? 'bg-emerald-50 border border-emerald-200' :
            result.type === 'antagonismo' ? 'bg-red-50 border border-red-200' :
            'bg-gray-50 border border-gray-200'
          }`}>
            {result.type === 'sinergia' && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">✅</span>
                  <h3 className="font-bold text-emerald-800 text-lg">¡Sinergia Detectada!</h3>
                </div>
                <p className="text-emerald-700">{result.data.descripcion}</p>
                <p className="text-sm text-emerald-600 mt-2">Nivel: <strong>{result.data.nivel}</strong></p>
              </div>
            )}
            {result.type === 'antagonismo' && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">⚠️</span>
                  <h3 className="font-bold text-red-800 text-lg">Antagonismo Detectado</h3>
                </div>
                <p className="text-red-700">{result.data.descripcion}</p>
              </div>
            )}
            {result.type === 'ninguna' && (
              <div className="text-center">
                <span className="text-4xl mb-2 block">❓</span>
                <p className="text-gray-600">No se encontró una relación directa entre estos ingredientes en la base de conocimiento.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

function CatalogoView({ onOpenAjustes }: { onOpenAjustes: () => void }) {
  const [scraperEnabled, setScraperEnabled] = useState(false);
  const [scraperLoading, setScraperLoading] = useState(false);

  const toggleScraper = async () => {
    setScraperLoading(true);
    try {
      const endpoint = scraperEnabled ? '/api/scraper/disable' : '/api/scraper/enable';
      const response = await fetch(endpoint, { method: 'POST' });
      const data = await response.json();
      if (data.success) {
        setScraperEnabled(!scraperEnabled);
        logger.success(`Scraper ${!scraperEnabled ? 'activado' : 'desactivado'}`, 'Scraper');
      }
    } catch (e) {
      logger.error('Error toggling scraper', 'Scraper');
    } finally {
      setScraperLoading(false);
    }
  };

  return (
    <main className="max-w-4xl mx-auto p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">🗃️ Catálogo y Base de Datos</h2>
      
      <div className="grid md:grid-cols-2 gap-6">
        {/* Scraper Card */}
        <div className="bg-white border rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              scraperEnabled ? 'bg-emerald-100' : 'bg-gray-100'
            }`}>
              <span className="text-2xl">🤖</span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Scraper Automático</h3>
              <p className="text-sm text-gray-500">Extrae productos de Farmacias Knop</p>
            </div>
          </div>
          
          <div className={`flex items-center gap-2 px-4 py-2 rounded-xl mb-4 ${
            scraperEnabled ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-600'
          }`}>
            <div className={`w-2 h-2 rounded-full ${scraperEnabled ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}`} />
            <span className="font-medium">{scraperEnabled ? 'Activo' : 'Inactivo'}</span>
          </div>
          
          <button
            onClick={toggleScraper}
            disabled={scraperLoading}
            className={`w-full py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
              scraperEnabled 
                ? 'bg-red-500 hover:bg-red-600 text-white' 
                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
            } disabled:opacity-50`}
          >
            {scraperLoading ? (
              <span className="animate-spin">⏳</span>
            ) : scraperEnabled ? (
              <><StopIcon /> Desactivar</>
            ) : (
              <><PlayIcon /> Activar</>
            )}
          </button>
        </div>

        {/* Ajustes Card */}
        <div className="bg-white border rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <span className="text-2xl">⚙️</span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Configuración</h3>
              <p className="text-sm text-gray-500">Ajustes del sistema</p>
            </div>
          </div>
          
          <p className="text-sm text-gray-600 mb-4">
            Accede a la configuración avanzada del scraper, sincronización con Supabase y más opciones de personalización.
          </p>
          
          <button
            onClick={onOpenAjustes}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            <SettingsIcon />
            Abrir Ajustes
          </button>
        </div>

        {/* Info Card */}
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-6 text-white md:col-span-2">
          <h3 className="font-semibold text-lg mb-2">📚 Acerca del Catálogo</h3>
          <p className="text-emerald-100 text-sm leading-relaxed">
            El catálogo local de Vademecum AI contiene información sobre principios activos, 
            vitaminas, minerales y suplementos nutricionales. Los datos se sincronizan con 
            Supabase para respaldo en la nube y acceso desde múltiples dispositivos.
          </p>
        </div>
      </div>
    </main>
  );
}

function AjustesView({ onClose }: { onClose: () => void }) {
  const [scraperEnabled, setScraperEnabled] = useState(false);
  const [scraperLoading, setScraperLoading] = useState(false);
  const [scraperInterval, setScraperInterval] = useState(60);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    loadScraperStatus();
    loadHistory();
  }, []);

  const loadScraperStatus = async () => {
    try {
      const response = await fetch('/api/scraper/status');
      const data = await response.json();
      if (data.success) {
        setScraperEnabled(data.isEnabled);
        setScraperInterval(data.intervalMinutes || 60);
      }
    } catch (e) {
      logger.error('Error cargando estado del scraper', 'Scraper');
    }
  };

  const loadHistory = async () => {
    try {
      const response = await fetch('/api/scraper/history?limit=10');
      const data = await response.json();
      if (data.success) {
        setHistory(data.history || []);
      }
    } catch (e) {
      logger.error('Error cargando historial', 'Scraper');
    }
  };

  const toggleScraper = async () => {
    setScraperLoading(true);
    try {
      const endpoint = scraperEnabled ? '/api/scraper/disable' : '/api/scraper/enable';
      const response = await fetch(endpoint, { method: 'POST' });
      const data = await response.json();
      if (data.success) {
        setScraperEnabled(!scraperEnabled);
        loadHistory();
      }
    } catch (e) {
      logger.error('Error toggling scraper', 'Scraper');
    } finally {
      setScraperLoading(false);
    }
  };

  const updateInterval = async (minutes: number) => {
    setScraperLoading(true);
    try {
      await fetch('/api/scraper/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ intervalMinutes: minutes })
      });
      setScraperInterval(minutes);
    } catch (e) {
      logger.error('Error actualizando intervalo', 'Scraper');
    } finally {
      setScraperLoading(false);
    }
  };

  return (
    <main className="max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">⚙️ Ajustes</h2>
        <button 
          onClick={onClose}
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 font-medium transition-colors"
        >
          ← Volver
        </button>
      </div>
      
      {/* Scraper Section */}
      <div className="bg-white border rounded-xl p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          🤖 Scraper en Segundo Plano
        </h3>
        
        <div className="flex flex-wrap gap-4 items-center mb-6">
          <button
            onClick={toggleScraper}
            disabled={scraperLoading}
            className={`px-6 py-3 rounded-xl font-medium transition-all flex items-center gap-2 ${
              scraperEnabled 
                ? 'bg-red-500 hover:bg-red-600 text-white' 
                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
            } disabled:opacity-50`}
          >
            {scraperEnabled ? <><StopIcon /> Desactivar</> : <><PlayIcon /> Activar</>}
          </button>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Intervalo:</span>
            <div className="flex gap-1">
              {[15, 30, 60, 120].map(m => (
                <button
                  key={m}
                  onClick={() => updateInterval(m)}
                  disabled={scraperLoading}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    scraperInterval === m 
                      ? 'bg-emerald-600 text-white' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {m}m
                </button>
              ))}
            </div>
          </div>
        </div>
        
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
        >
          {showHistory ? 'Ocultar' : 'Ver'} Historial ({history.length} entradas)
        </button>
        
        {showHistory && (
          <div className="mt-4 bg-gray-50 rounded-xl p-4 max-h-64 overflow-y-auto">
            {history.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No hay historial de ejecuciones</p>
            ) : (
              <div className="space-y-2">
                {history.map((h, i) => (
                  <div key={h.id || i} className="flex justify-between items-center text-sm p-2 bg-white rounded">
                    <span className="text-gray-600">
                      {new Date(h.start_time).toLocaleString()}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      h.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                      h.status === 'failed' ? 'bg-red-100 text-red-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {h.products_scraped || 0} productos • {h.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* System Info */}
      <div className="bg-gray-50 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">ℹ️ Información del Sistema</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Ingredientes KB:</span>
            <span className="ml-2 font-medium text-gray-900">{getIngredientCount()}</span>
          </div>
          <div>
            <span className="text-gray-500">Sinergias:</span>
            <span className="ml-2 font-medium text-gray-900">
              {synergyGraphService.obtenerEstadisticas().sinergiasTotales}
            </span>
          </div>
          <div>
            <span className="text-gray-500">Antagonismos:</span>
            <span className="ml-2 font-medium text-gray-900">
              {synergyGraphService.obtenerEstadisticas().antagonismosTotales}
            </span>
          </div>
          <div>
            <span className="text-gray-500">Versión:</span>
            <span className="ml-2 font-medium text-gray-900">2.0.0</span>
          </div>
        </div>
      </div>
    </main>
  );
}

// ==================== MAIN COMPONENT ====================

export default function DashboardV2() {
  const [loading, setLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState('Cargando...');
  const [products, setProducts] = useState<AnalyzedProduct[]>([]);
  const [view, setView] = useState<ViewType>('productos');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('todas');
  const [selectedIngredient, setSelectedIngredient] = useState<any>(null);
  const [showAjustes, setShowAjustes] = useState(false);

  const kb = useMemo(() => getCombinedKnowledgeBase(), []);
  const supabaseConnected = supabaseService.isConfigured();

  // Extraer categorías únicas de los productos
  const categories = useMemo(() => {
    const cats = new Set<string>();
    products.forEach(p => {
      if (p.categoria_principal) cats.add(p.categoria_principal);
      if (p.categoria) cats.add(p.categoria);
    });
    return Array.from(cats).sort();
  }, [products]);

  // Filtrar productos
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      // Filtro de búsqueda
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchNombre = (p.nombre_comercial || '').toLowerCase().includes(q);
        const matchDesc = (p.descripcion || '').toLowerCase().includes(q);
        const matchIng = (p.ingredientes_encontrados || []).some((id: string) => 
          (kb[id]?.nombre || '').toLowerCase().includes(q)
        );
        if (!matchNombre && !matchDesc && !matchIng) return false;
      }
      
      // Filtro de categoría
      if (selectedCategory !== 'todas') {
        if (p.categoria_principal !== selectedCategory && p.categoria !== selectedCategory) {
          return false;
        }
      }
      
      return true;
    });
  }, [products, searchQuery, selectedCategory, kb]);

  // Estadísticas
  const stats = useMemo(() => {
    const total = products.length;
    const withKbMatch = products.filter(p => p.cobertura_kb > 0).length;
    const withSynergies = products.filter(p => (p.sinergias_detectadas?.length || 0) > 0).length;
    return { total, withKbMatch, withSynergies };
  }, [products]);

  // Cargar productos
  useEffect(() => {
    const loadProducts = async () => {
      setLoading(true);
      setLoadingMessage('Conectando a Supabase...');
      
      try {
        const response = await fetch('/api/products');
        if (response.ok) {
          const data = await response.json();
          if (data && data.length > 0) {
            logger.info('Analizando productos...', 'DashboardV2');
            const analyzed = data.map((product: Product) => {
              const { found, sinergias } = analyzeProduct(product, kb);
              const principiosCount = (product.principios_activos || []).length;
              const cobertura = principiosCount > 0 ? Math.round((found.length / principiosCount) * 100) : 0;
              return {
                ...product,
                ingredientes_encontrados: found,
                cobertura_kb: Math.min(cobertura, 100),
                sinergias_detectadas: sinergias
              };
            });
            setProducts(analyzed);
          } else {
            logger.info('Sin productos en la nube', 'DashboardV2');
            setLoadingMessage('No hay productos. Ejecuta el scraper.');
          }
        } else {
          setLoadingMessage('Error al conectar con la API');
        }
      } catch (e) {
        logger.error('Exception en DashboardV2', 'DashboardV2', e);
        setLoadingMessage('Error al cargar productos');
      }
      
      setLoading(false);
    };

    loadProducts();
  }, [kb]);

  // Si estamos en vista de ajustes
  if (showAjustes) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Header 
          productCount={stats.total} 
          connected={supabaseConnected}
          onSearch={() => {}}
          onOpenAjustes={() => setShowAjustes(false)}
        />
        <AjustesView onClose={() => setShowAjustes(false)} />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Header 
          productCount={0} 
          connected={false}
          onSearch={() => {}}
          onOpenAjustes={() => {}}
        />
        <LoadingState message={loadingMessage} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Header 
        productCount={stats.total} 
        connected={supabaseConnected}
        onSearch={setSearchQuery}
        onOpenAjustes={() => setShowAjustes(true)}
      />
      
      {/* Quick Stats Bar */}
      <div className="bg-emerald-50 border-b px-4 py-2">
        <div className="max-w-7xl mx-auto flex flex-wrap gap-6 text-sm">
          <span>
            <strong className="text-emerald-700">{stats.total}</strong> productos
          </span>
          <span>
            <strong className="text-emerald-700">{stats.withKbMatch}</strong> en KB
          </span>
          <span>
            <strong className="text-emerald-700">{stats.withSynergies}</strong> con sinergias
          </span>
        </div>
      </div>

      <TabNav 
        active={view} 
        onChange={setView} 
        productCount={stats.total} 
      />
      
      {view === 'productos' && (
        <>
          <CategoryFilter 
            categories={categories} 
            selected={selectedCategory} 
            onSelect={setSelectedCategory} 
          />
          
          <main className="max-w-7xl mx-auto p-4">
            <div className="mb-4 text-sm text-gray-500">
              {filteredProducts.length} productos
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProducts.map((prod) => (
                <ProductCard
                  key={prod.sku}
                  product={prod}
                  kb={kb}
                  onClick={() => {
                    const ing = kb[prod.ingredientes_encontrados?.[0]] || { 
                      id: prod.sku, 
                      nombre: prod.nombre_comercial || prod.sku, 
                      descripcion: prod.descripcion, 
                      categoria: prod.categoria_principal || 'KB', 
                      beneficios: [], 
                      mecanismo_accion: '' 
                    };
                    setSelectedIngredient(ing);
                  }}
                />
              ))}
            </div>
            
            {filteredProducts.length === 0 && (
              <div className="text-center py-16">
                <span className="text-6xl mb-4 block">🔍</span>
                <p className="text-lg text-gray-500">No se encontraron productos</p>
                <p className="text-sm text-gray-400 mt-2">Intenta con otros términos de búsqueda</p>
              </div>
            )}
          </main>
        </>
      )}
      
      {view === 'sinergias' && <SynergyFinder kb={kb} />}
      
      {view === 'stats' && <StatsView kb={kb} categories={categories} />}
      
      {view === 'catalogo' && <CatalogoView onOpenAjustes={() => setShowAjustes(true)} />}
      
      {view === 'ajustes' && <AjustesView onClose={() => setView('productos')} />}
      
      {selectedIngredient && (
        <IngredientDetail 
          ingredient={selectedIngredient} 
          onClose={() => setSelectedIngredient(null)} 
        />
      )}
    </div>
  );
}
