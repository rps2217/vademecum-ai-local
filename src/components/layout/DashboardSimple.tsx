/**
 * DashboardSimple - Interfaz Minimalista de Alto Rendimiento
 * Inspirado en appsimple: limpio, simple, rápido
 */

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { 
  Search, Database, Settings, Activity, Pill, 
  Link2, BarChart3, X, ChevronRight, 
  CheckCircle2, AlertCircle, Cloud, CloudOff,
  Loader2, Zap, Sparkles, Copy, ExternalLink, 
  Package, Info, TrendingUp, RefreshCw, Brain, Leaf
} from 'lucide-react';
import { getCombinedKnowledgeBase, getIngredientCount } from '../../core/knowledge-base';
import { synergyGraphService } from '../../core/knowledge-base/SynergyGraph';
import { knowledgeService, type ProductAnalysis } from '../../services/KnowledgeService';
import { knowledgeSyncService, type SyncStatus } from '../../services/KnowledgeSyncService';
import { Product } from '../../core/types/product.types';
import { supabaseService } from '../../services/SupabaseService';
import { dataService } from '../../services/DataService';
import { searchService } from '../../services/SearchService';
import { cn } from '../../lib/utils';
import { logger } from '../../services/LoggerService';
import { SupabaseSetup } from '../common/SupabaseSetup';

// Tipos
interface AnalyzedProduct extends Product {
  ingredientes_encontrados: string[];
  cobertura_kb: number;
  sinergias_detectadas: string[];
  kbAnalysis?: ProductAnalysis | null;
}

interface ScrapingState {
  [sku: string]: 'idle' | 'scraping' | 'success' | 'error';
}

// Extensión del tipo Product para incluir campos adicionales del scraping
interface ExtendedProduct extends AnalyzedProduct {
  marca?: string;
  precio?: string;
  imagen_url?: string;
  url_externa?: string;
}

type ViewType = 'buscar' | 'catalogo' | 'sinergias' | 'ajustes';

// ==================== ICONOS SVG ====================
const IconPill = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M8.5 8.5l7 7M10.5 7.5C8.5 5.5 5.5 5.5 3.5 7.5c-2 2-2 5 0 7l7 7 7-7c2-2 2-5 0-7-2-2-5-2-7 0z"/>
    <circle cx="10" cy="10" r="2"/>
  </svg>
);

const IconSynergy = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="6" cy="12" r="3"/>
    <circle cx="18" cy="12" r="3"/>
    <circle cx="12" cy="6" r="3"/>
    <path d="M12 9v3M8.5 10.5L9.5 9.5M15.5 10.5L14.5 9.5"/>
  </svg>
);

const IconChart = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M3 3v18h18"/>
    <path d="M7 16l4-4 4 2 5-6"/>
  </svg>
);

// ==================== HELPERS ====================
function analyzeProduct(product: Product, kb: Record<string, any>): { 
  found: string[]; 
  sinergias: string[];
  kbAnalysis: ProductAnalysis | null;
} {
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

  // Análisis con KnowledgeService
  const kbAnalysis = knowledgeService.analyzeProduct({
    sku: product.sku,
    nombre_comercial: product.nombre_comercial,
    principios_activos: product.principios_activos
  });

  return { found, sinergias, kbAnalysis };
}

// ==================== COMPONENTS ====================

// Header minimalista
function HeaderSimple({ 
  productCount, 
  connected,
  query,
  onQueryChange,
}: { 
  productCount: number; 
  connected: boolean;
  query: string;
  onQueryChange: (q: string) => void;
}) {
  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
            <Pill className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold text-gray-900 tracking-tight">Vademecum</span>
        </div>

        {/* Search */}
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              placeholder="Buscar medicamento..."
              className="w-full pl-9 pr-8 py-2 bg-gray-50 border-0 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:bg-white transition-all"
            />
            {query && (
              <button 
                onClick={() => onQueryChange('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-200 rounded"
              >
                <X className="w-3.5 h-3.5 text-gray-400" />
              </button>
            )}
          </div>
        </div>

        {/* Status */}
        <div className="flex items-center gap-2">
          <div className={cn(
            "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
            connected ? "bg-emerald-50 text-emerald-600" : "bg-gray-100 text-gray-500"
          )}>
            {connected ? <Cloud className="w-3 h-3" /> : <CloudOff className="w-3 h-3" />}
            {connected ? 'Nube' : 'Local'}
          </div>
          <span className="text-xs text-gray-400">{productCount} meds</span>
        </div>
      </div>
    </header>
  );
}

// Navegación lateral minimalista
function Sidebar({ 
  active, 
  onChange,
  stats,
}: { 
  active: ViewType; 
  onChange: (v: ViewType) => void;
  stats: { total: number; kbMatch: number; sinergias: number };
}) {
  const items = [
    { id: 'buscar' as ViewType, label: 'Buscar', icon: Search },
    { id: 'catalogo' as ViewType, label: 'Catálogo', icon: Database },
    { id: 'sinergias' as ViewType, label: 'Sinergias', icon: IconSynergy },
    { id: 'ajustes' as ViewType, label: 'Ajustes', icon: Settings },
  ];

  return (
    <aside className="w-56 shrink-0 border-r border-gray-100 bg-gray-50/50">
      <nav className="p-3 space-y-0.5">
        {items.map(item => (
          <button
            key={item.id}
            onClick={() => onChange(item.id)}
            className={cn(
              "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
              active === item.id 
                ? "bg-white text-gray-900 shadow-sm" 
                : "text-gray-500 hover:bg-white/60 hover:text-gray-700"
            )}
          >
            <item.icon className="w-4 h-4" />
            {item.label}
          </button>
        ))}
      </nav>

      {/* Stats rápidas */}
      <div className="p-3 mt-4 border-t border-gray-100">
        <p className="text-xs text-gray-400 font-medium mb-2">RESUMEN</p>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500">Productos</span>
            <span className="font-semibold text-gray-900">{stats.total}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500">En KB</span>
            <span className="font-semibold text-emerald-600">{stats.kbMatch}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500">Sinergias</span>
            <span className="font-semibold text-violet-600">{stats.sinergias}</span>
          </div>
        </div>
      </div>
    </aside>
  );
}

// Card de producto mejorada con más información
const ProductCard = React.memo(function ProductCard({ 
  product, 
  kb,
  onSelect,
  onScrape,
  scrapeState
}: { 
  product: AnalyzedProduct; 
  kb: Record<string, any>;
  onSelect: () => void;
  onScrape: (sku: string) => void;
  scrapeState: 'idle' | 'scraping' | 'success' | 'error';
}) {
  const principios = useMemo(() => 
    (product.principios_activos || []).slice(0, 2).join(', '),
    [product.principios_activos]
  );

  const hasSynergy = (product.sinergias_detectadas?.length || 0) > 0;
  const synergyCount = product.sinergias_detectadas?.length || 0;
  
  // Determinar si el producto necesita scraping (info incompleta)
  const needsScrape = !product.nombre_comercial || !product.descripcion;
  const isIncomplete = needsScrape || !product.nombre_comercial;
  
  // Copiar SKU al portapapeles
  const handleCopySku = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(product.sku);
    logger.info(`SKU copiado: ${product.sku}`, 'Dashboard');
  };
  
  const handleScrapeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onScrape(product.sku);
  };

  return (
    <button
      onClick={onSelect}
      className={cn(
        "w-full text-left bg-white border rounded-xl p-4 transition-all group",
        "hover:border-gray-200 hover:shadow-md",
        isIncomplete ? "border-amber-200 border-dashed" : "border-gray-100",
        "animate-fade-in"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Badge de incompleto */}
          {isIncomplete && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-amber-50 text-amber-600 text-[10px] font-medium rounded mb-1">
              <Info className="w-3 h-3" />
              Incompleto
            </span>
          )}
          
          <h3 className={cn(
            "font-medium text-sm line-clamp-1 transition-colors",
            isIncomplete ? "text-gray-500" : "text-gray-900 group-hover:text-emerald-600"
          )}>
            {product.nombre_comercial || product.sku}
          </h3>
          
          {/* SKU y principios */}
          <div className="flex items-center gap-2 mt-1">
            <button
              onClick={handleCopySku}
              className="text-[10px] text-gray-400 hover:text-gray-600 flex items-center gap-1 transition-colors"
              title="Copiar SKU"
            >
              <Copy className="w-3 h-3" />
              {product.sku}
            </button>
          </div>
          
          {principios && (
            <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">
              {principios}
            </p>
          )}
        </div>
        
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          {/* Indicadores de estado */}
          <div className="flex items-center gap-1">
            {/* Botón de scraping */}
            <button
              onClick={handleScrapeClick}
              className={cn(
                "w-7 h-7 rounded-lg flex items-center justify-center transition-all",
                "hover:bg-gray-100 text-gray-400 hover:text-gray-600",
                scrapeState === 'scraping' && "animate-pulse",
                scrapeState === 'success' && "text-emerald-500",
                scrapeState === 'error' && "text-red-500"
              )}
              title={needsScrape ? "Buscar información" : "Actualizar información"}
            >
              {scrapeState === 'scraping' ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : scrapeState === 'success' ? (
                <CheckCircle2 className="w-3.5 h-3.5" />
              ) : scrapeState === 'error' ? (
                <AlertCircle className="w-3.5 h-3.5" />
              ) : (
                <Sparkles className={cn(
                  "w-3.5 h-3.5",
                  needsScrape && "text-amber-500"
                )} />
              )}
            </button>
          </div>
          
          {/* Badges inferiores */}
          <div className="flex items-center gap-1.5">
            {hasSynergy && (
              <span className="flex items-center gap-1 px-1.5 py-0.5 bg-violet-50 text-violet-600 text-[10px] font-medium rounded">
                <TrendingUp className="w-3 h-3" />
                {synergyCount}
              </span>
            )}
            {product.cobertura_kb > 0 && (
              <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-600 text-[10px] font-medium rounded">
                {product.cobertura_kb}%
              </span>
            )}
            <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-400 transition-colors" />
          </div>
        </div>
      </div>

      {/* Tags de categoría */}
      {product.categoria_principal && (
        <div className="mt-2 flex items-center gap-1">
          <span className="text-[10px] text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded">
            {product.categoria_principal}
          </span>
        </div>
      )}
    </button>
  );
});

// Filtro de categorías
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
    <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-hide">
      <button
        onClick={() => onSelect('todas')}
        className={cn(
          "shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
          selected === 'todas' 
            ? "bg-gray-900 text-white" 
            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
        )}
      >
        Todas
      </button>
      {categories.slice(0, 8).map(cat => (
        <button
          key={cat}
          onClick={() => onSelect(cat)}
          className={cn(
            "shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
            selected === cat 
              ? "bg-gray-900 text-white" 
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          )}
        >
          {cat}
        </button>
      ))}
    </div>
  );
}

// Loading state
function LoadingState() {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="flex items-center gap-2 text-gray-400">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-sm">Cargando...</span>
      </div>
    </div>
  );
}

// Empty state
function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mb-3">
        <Search className="w-5 h-5 text-gray-400" />
      </div>
      <p className="text-sm text-gray-500">{message}</p>
    </div>
  );
}

// Vista: Buscar/Productos
function SearchView({ 
  products, 
  kb, 
  query,
  categories,
  selectedCategory,
  onCategoryChange,
  onSelectProduct,
  onScrapeProduct,
  scrapeStates,
}: {
  products: AnalyzedProduct[];
  kb: Record<string, any>;
  query: string;
  categories: string[];
  selectedCategory: string;
  onCategoryChange: (cat: string) => void;
  onSelectProduct: (product: AnalyzedProduct) => void;
  onScrapeProduct: (sku: string) => void;
  scrapeStates: ScrapingState;
}) {
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      // Filtro de búsqueda
      if (query) {
        const q = query.toLowerCase();
        
        // Buscar por SKU primero (prioridad más alta)
        const matchSku = (p.sku || '').toLowerCase().includes(q);
        
        // Si busca solo números o código, dar prioridad al SKU
        const isSkuSearch = /^\d+$/.test(q.replace(/\s/g, ''));
        
        const matchNombre = (p.nombre_comercial || '').toLowerCase().includes(q);
        const matchDesc = (p.descripcion || '').toLowerCase().includes(q);
        const matchIng = (p.principios_activos || []).some((id: string) => 
          String(id).toLowerCase().includes(q)
        );
        const matchMarca = (p.marca || '').toLowerCase().includes(q);
        
        // Si es búsqueda por SKU exacto, mostrar solo coincidencias de SKU
        if (isSkuSearch || matchSku) {
          if (matchSku) return true;
        }
        
        // Búsqueda normal: nombre, descripción, principios, marca
        if (!matchNombre && !matchDesc && !matchIng && !matchMarca) return false;
      }
      
      // Filtro de categoría
      if (selectedCategory !== 'todas') {
        if (p.categoria_principal !== selectedCategory && p.categoria !== selectedCategory) {
          return false;
        }
      }
      
      return true;
    });
  }, [products, query, selectedCategory]);

  if (products.length === 0) {
    return <EmptyState message="Sin productos disponibles" />;
  }

  return (
    <div>
      <CategoryFilter 
        categories={categories} 
        selected={selectedCategory} 
        onSelect={onCategoryChange} 
      />
      
      <div className="mt-3 mb-2 text-xs text-gray-400">
        {filteredProducts.length} medicamento{filteredProducts.length !== 1 ? 's' : ''}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {filteredProducts.map(prod => (
          <ProductCard
            key={prod.sku}
            product={prod}
            kb={kb}
            onSelect={() => onSelectProduct(prod)}
            onScrape={onScrapeProduct}
            scrapeState={scrapeStates[prod.sku] || 'idle'}
          />
        ))}
      </div>

      {filteredProducts.length === 0 && query && (
        <div className="text-center py-8 text-gray-400">
          <p className="text-sm">No hay resultados para "{query}"</p>
          {/^\d+$/.test(query.replace(/\s/g, '')) && (
            <p className="text-xs mt-2 text-violet-500">
              💡 Este SKU no está en tu base de datos local.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// Vista: Catálogo
function CatalogView({ 
  stats, 
  kbStats,
  syncStatus,
  onSync 
}: { 
  stats: { total: number; kbMatch: number; sinergias: number }; 
  kbStats: { total: number; families: number; types: number };
  syncStatus: SyncStatus;
  onSync: () => void;
}) {
  const kbSynStats = synergyGraphService.obtenerEstadisticas();
  const isSyncing = syncStatus.status === 'syncing';
  const lastSync = syncStatus.status === 'synced' 
    ? new Date().toLocaleTimeString() 
    : null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Base de Datos</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="Productos" value={stats.total} />
          <StatCard label="Ingredientes KB" value={getIngredientCount()} color="emerald" />
          <StatCard label="Sinergias" value={kbSynStats.sinergiasTotales} color="violet" />
          <StatCard label="Antagonismos" value={kbSynStats.antagonismosTotales} color="red" />
        </div>
      </div>
      
      {/* Panel de Base de Conocimiento Fitoterapéutica con Sincronización */}
      <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-5 border border-emerald-100">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Leaf className="w-5 h-5 text-emerald-600" />
            <h3 className="font-semibold text-gray-900">Base de Conocimiento</h3>
          </div>
          <button
            onClick={onSync}
            disabled={isSyncing}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
              isSyncing 
                ? "bg-emerald-100 text-emerald-400 cursor-not-allowed"
                : "bg-emerald-500 text-white hover:bg-emerald-600"
            )}
          >
            <RefreshCw className={cn("w-3.5 h-3.5", isSyncing && "animate-spin")} />
            {isSyncing ? 'Sincronizando...' : 'Sincronizar'}
          </button>
        </div>
        
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-emerald-600">{kbStats.total}</div>
            <div className="text-xs text-gray-500 mt-1">Ingredientes</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-emerald-600">{kbStats.familias}</div>
            <div className="text-xs text-gray-500 mt-1">Familias</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-emerald-600">{kbStats.types}</div>
            <div className="text-xs text-gray-500 mt-1">Tipos</div>
          </div>
        </div>
        
        {lastSync && (
          <p className="text-xs text-emerald-600 mt-3 text-center">
            ✓ Sincronizado a las {lastSync}
          </p>
        )}
        
        <p className="text-xs text-gray-500 mt-2 text-center">
          Fitoterapia, homeopatía, vitaminas y minerales verificados
        </p>
        
        {syncStatus.status === 'error' && (
          <p className="text-xs text-red-500 mt-2 text-center">
            Error: {syncStatus.error}
          </p>
        )}
      </div>

      {/* Panel de Sincronización Multi-Dispositivo */}
      <div className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-2xl p-5 border border-violet-100">
        <div className="flex items-center gap-2 mb-3">
          <Cloud className="w-5 h-5 text-violet-600" />
          <h3 className="font-semibold text-gray-900">Sincronización en la Nube</h3>
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Estado:</span>
            <span className={cn(
              "px-2 py-0.5 rounded-full text-xs font-medium",
              syncStatus.status === 'synced' ? "bg-emerald-100 text-emerald-700" :
              syncStatus.status === 'syncing' ? "bg-amber-100 text-amber-700" :
              syncStatus.status === 'error' ? "bg-red-100 text-red-700" :
              "bg-gray-100 text-gray-700"
            )}>
              {syncStatus.status === 'synced' ? 'Sincronizado' :
               syncStatus.status === 'syncing' ? 'Sincronizando...' :
               syncStatus.status === 'error' ? 'Error' : 'Listo'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Dispositivos:</span>
            <span className="text-gray-900">Todos sincronizados</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Offline:</span>
            <span className="text-emerald-600 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Disponible
            </span>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-3">
          La base de conocimiento se sincroniza automáticamente con Supabase. 
          Disponible offline en todos tus dispositivos.
        </p>
      </div>
    </div>
  );
}

function StatCard({ label, value, color = 'gray' }: { label: string; value: number; color?: string }) {
  const colorClasses = {
    gray: 'bg-gray-50 text-gray-900',
    emerald: 'bg-emerald-50 text-emerald-600',
    violet: 'bg-violet-50 text-violet-600',
    red: 'bg-red-50 text-red-600',
  };

  return (
    <div className={cn("rounded-xl p-4", colorClasses[color as keyof typeof colorClasses])}>
      <div className="text-2xl font-bold">{value.toLocaleString()}</div>
      <div className="text-xs opacity-70 mt-0.5">{label}</div>
    </div>
  );
}

// Vista: Sinergias
function SynergyView({ kb }: { kb: Record<string, any> }) {
  const kbEntries = useMemo(() => Object.entries(kb).slice(0, 20), [kb]);
  const kbIngredients = knowledgeService.getAllIngredients();
  const [selectedType, setSelectedType] = useState<'all' | 'sinergia' | 'antagonismo'>('all');

  // Obtener ingredientes con sinergias
  const ingredientsWithSynergies = useMemo(() => {
    return kbIngredients
      .filter(ing => ing.sinergias.length > 0)
      .sort((a, b) => b.sinergias.length - a.sinergias.length)
      .slice(0, 15);
  }, []);

  // Obtener ingredientes con antagonismos
  const ingredientsWithAntagonisms = useMemo(() => {
    return kbIngredients
      .filter(ing => ing.antagonismos.length > 0)
      .sort((a, b) => b.antagonismos.length - a.antagonismos.length)
      .slice(0, 10);
  }, []);

  return (
    <div className="space-y-6">
      {/* Panel de resumen */}
      <div className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-2xl p-5 border border-violet-100">
        <div className="flex items-center gap-2 mb-4">
          <Brain className="w-5 h-5 text-violet-600" />
          <h3 className="font-semibold text-gray-900">Análisis de Interacciones</h3>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/60 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-violet-600">{ingredientsWithSynergies.length}</div>
            <div className="text-xs text-gray-500 mt-1">Con Sinergias</div>
          </div>
          <div className="bg-white/60 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-amber-600">{ingredientsWithAntagonisms.length}</div>
            <div className="text-xs text-gray-500 mt-1">Con Antagonismos</div>
          </div>
        </div>
      </div>

      {/* Tabs para filtrar */}
      <div className="flex gap-2">
        <button
          onClick={() => setSelectedType('all')}
          className={cn(
            "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
            selectedType === 'all' 
              ? "bg-violet-100 text-violet-700" 
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          )}
        >
          Todos
        </button>
        <button
          onClick={() => setSelectedType('sinergia')}
          className={cn(
            "px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5",
            selectedType === 'sinergia' 
              ? "bg-emerald-100 text-emerald-700" 
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          )}
        >
          <Sparkles className="w-3.5 h-3.5" />
          Sinergias
        </button>
        <button
          onClick={() => setSelectedType('antagonismo')}
          className={cn(
            "px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5",
            selectedType === 'antagonismo' 
              ? "bg-amber-100 text-amber-700" 
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          )}
        >
          <AlertCircle className="w-3.5 h-3.5" />
          Antagonismos
        </button>
      </div>

      {/* Lista de ingredientes */}
      <div className="space-y-3">
        {(selectedType === 'all' || selectedType === 'sinergia') && ingredientsWithSynergies.map((ing) => (
          <div key={ing.id} className="bg-white border border-gray-100 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="font-medium text-gray-900 text-sm">{ing.nombre}</h4>
                <span className="text-xs text-gray-400">{ing.familia}</span>
              </div>
              <span className="text-xs bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full">
                {ing.sinergias.length} sinergia{ing.sinergias.length !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {ing.sinergias.slice(0, 4).map((synergyId) => {
                const synergyIng = kbIngredients.find(i => i.id === synergyId);
                return synergyIng ? (
                  <span key={synergyId} className="text-xs bg-emerald-50 text-emerald-700 px-2 py-1 rounded-lg flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    {synergyIng.nombre}
                  </span>
                ) : (
                  <span key={synergyId} className="text-xs bg-gray-50 text-gray-600 px-2 py-1 rounded">
                    {synergyId}
                  </span>
                );
              })}
              {ing.sinergias.length > 4 && (
                <span className="text-xs text-gray-400 px-1 py-1">+{ing.sinergias.length - 4} más</span>
              )}
            </div>
            {ing.notas && (
              <p className="text-xs text-gray-500 mt-2 italic">{ing.notas}</p>
            )}
          </div>
        ))}

        {(selectedType === 'all' || selectedType === 'antagonismo') && ingredientsWithAntagonisms.map((ing) => (
          <div key={ing.id} className="bg-white border border-amber-100 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="font-medium text-gray-900 text-sm">{ing.nombre}</h4>
                <span className="text-xs text-gray-400">{ing.familia}</span>
              </div>
              <span className="text-xs bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full">
                {ing.antagonismos.length} antagonismo{ing.antagonismos.length !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {ing.antagonismos.slice(0, 4).map((antId) => {
                const antIng = kbIngredients.find(i => i.id === antId);
                return antIng ? (
                  <span key={antId} className="text-xs bg-amber-50 text-amber-700 px-2 py-1 rounded-lg flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {antIng.nombre}
                  </span>
                ) : (
                  <span key={antId} className="text-xs bg-gray-50 text-gray-600 px-2 py-1 rounded">
                    {antId}
                  </span>
                );
              })}
              {ing.antagonismos.length > 4 && (
                <span className="text-xs text-gray-400 px-1 py-1">+{ing.antagonismos.length - 4} más</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Vista: Ajustes
function SettingsView({ connected }: { connected: boolean }) {
  const [refreshKey, setRefreshKey] = useState(0);
  const [localProductCount, setLocalProductCount] = useState<number | null>(null);

  // Obtener cantidad de productos locales
  useEffect(() => {
    const checkLocalProducts = async () => {
      try {
        const products = await dataService.getAllProducts();
        setLocalProductCount(products.length);
      } catch (e) {
        setLocalProductCount(0);
      }
    };
    checkLocalProducts();
  }, [refreshKey]);

  const handleSupabaseConnected = () => {
    setRefreshKey(prev => prev + 1);
    window.location.reload();
  };

  const handleForceSync = async () => {
    if (!confirm('¿Forzar sincronización? Esto borrará los datos locales y descargará todo desde la nube.')) {
      return;
    }
    
    // Limpiar cache local
    localStorage.removeItem('synced_products');
    
    // Recargar
    window.location.reload();
  };

  const handleClearLocal = async () => {
    if (!confirm('¿Borrar datos locales? Necesitarás sincronizar desde la nube.')) {
      return;
    }
    
    try {
      // Limpiar base de datos local
      const { database } = await import('../../database');
      await database.write(async () => {
        await database.unsafeResetDatabase();
      });
      
      // Limpiar cache
      localStorage.removeItem('synced_products');
      localStorage.removeItem('last_sync');
      
      alert('Datos locales eliminados. Recarga la página para sincronizar desde la nube.');
      window.location.reload();
    } catch (error) {
      console.error('Error clearing local data:', error);
      alert('Error al borrar datos locales.');
    }
  };

  return (
    <div className="space-y-6 max-w-lg">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Configuración</h2>
        
        {/* Estado de conexión */}
        <div className="bg-white border border-gray-100 rounded-xl p-4 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center",
                connected ? "bg-emerald-100" : "bg-gray-100"
              )}>
                {connected ? (
                  <Cloud className="w-5 h-5 text-emerald-600" />
                ) : (
                  <CloudOff className="w-5 h-5 text-gray-400" />
                )}
              </div>
              <div>
                <p className="font-medium text-gray-900">
                  {connected ? 'Supabase Conectado' : 'Modo Local'}
                </p>
                <p className="text-xs text-gray-500">
                  {connected ? 'Sincronización activa' : 'Sin conexión a la nube'}
                </p>
              </div>
            </div>
            
            {connected && (
              <span className="px-2.5 py-1 bg-emerald-50 text-emerald-600 text-xs font-medium rounded-full">
                Activo
              </span>
            )}
          </div>
        </div>

        {/* Configuración de Supabase */}
        <div className="mb-4">
          <SupabaseSetup onConnected={handleSupabaseConnected} />
        </div>

        {/* Info del sistema */}
        <div className="space-y-3">
          <SettingRow 
            label="Base de datos local" 
            value={`${localProductCount !== null ? localProductCount : '...' } productos`}
            icon={<Database className="w-4 h-4 text-gray-400" />}
          />
          <SettingRow 
            label="Índice de búsqueda" 
            value="MiniSearch"
            icon={<Search className="w-4 h-4 text-gray-400" />}
          />
          <SettingRow 
            label="Versión" 
            value="2.0.0"
            icon={<Zap className="w-4 h-4 text-gray-400" />}
          />
        </div>

        {/* Acciones de datos */}
        {connected && localProductCount !== null && localProductCount < 10 && (
          <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <p className="text-sm text-amber-800 mb-3">
              ⚠️ Solo tienes {localProductCount} productos locales. 
              Sincroniza para obtener los datos completos.
            </p>
            <button
              onClick={handleClearLocal}
              className="text-xs text-amber-600 hover:text-amber-800 underline"
            >
              Borrar datos locales y sincronizar
            </button>
          </div>
        )}
      </div>

      <div className="pt-4 border-t border-gray-100">
        <p className="text-xs text-gray-400 text-center">
          Vademecum AI • Solo para profesionales de la salud
        </p>
      </div>
    </div>
  );
}

function SettingRow({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-sm text-gray-700">{label}</span>
      </div>
      <span className="text-sm text-gray-400">{value}</span>
    </div>
  );
}

// Modal de detalle de producto mejorado
function ProductDetailModal({ 
  product, 
  kb,
  onClose,
  onScrape,
  scrapeState
}: { 
  product: AnalyzedProduct; 
  kb: Record<string, any>;
  onClose: () => void;
  onScrape: (sku: string) => void;
  scrapeState: 'idle' | 'scraping' | 'success' | 'error';
}) {
  const principios = (product.principios_activos || []).join(', ');
  const sinergias = product.sinergias_detectadas || [];
  const needsScrape = !product.nombre_comercial || !product.descripcion;
  
  // Copiar SKU
  const handleCopySku = () => {
    navigator.clipboard.writeText(product.sku);
  };

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[85vh] overflow-hidden animate-scale-in">
        {/* Header con gradiente sutil */}
        <div className="relative p-5 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              {/* Badge de estado */}
              <div className="flex items-center gap-2 mb-2">
                {needsScrape ? (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-50 text-amber-600 text-xs font-medium rounded-lg">
                    <Info className="w-3 h-3" />
                    Información incompleta
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-50 text-emerald-600 text-xs font-medium rounded-lg">
                    <CheckCircle2 className="w-3 h-3" />
                    Completo
                  </span>
                )}
                
                {product.cobertura_kb > 0 && (
                  <span className="px-2 py-1 bg-violet-50 text-violet-600 text-xs font-medium rounded-lg">
                    KB: {product.cobertura_kb}%
                  </span>
                )}
              </div>
              
              <h2 className="text-xl font-semibold text-gray-900 line-clamp-2">
                {product.nombre_comercial || 'Sin nombre'}
              </h2>
              
              {/* SKU con botón de copiar */}
              <div className="flex items-center gap-2 mt-1">
                <button
                  onClick={handleCopySku}
                  className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1 transition-colors"
                >
                  <Copy className="w-3 h-3" />
                  SKU: {product.sku}
                </button>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Botón de scrape */}
              <button
                onClick={() => onScrape(product.sku)}
                disabled={scrapeState === 'scraping'}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all",
                  scrapeState === 'scraping' 
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : needsScrape
                      ? "bg-amber-50 text-amber-600 hover:bg-amber-100"
                      : "bg-violet-50 text-violet-600 hover:bg-violet-100"
                )}
              >
                {scrapeState === 'scraping' ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Buscando...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    {needsScrape ? 'Completar' : 'Actualizar'}
                  </>
                )}
              </button>
              
              <button 
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
          </div>
        </div>

        {/* Content scrollable */}
        <div className="p-5 overflow-y-auto max-h-[calc(85vh-160px)] space-y-5">
          {/* Principios activos */}
          {principios && (
            <div className="bg-gray-50 rounded-xl p-4">
              <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Principios Activos</h3>
              <p className="text-sm text-gray-700">{principios}</p>
            </div>
          )}
          
          {/* Descripción */}
          {product.descripcion ? (
            <div>
              <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Descripción</h3>
              <p className="text-sm text-gray-700 leading-relaxed">{product.descripcion}</p>
            </div>
          ) : (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <p className="text-sm text-amber-700 flex items-center gap-2">
                <Info className="w-4 h-4" />
                Este producto no tiene descripción. Haz clic en "Completar" para buscar información.
              </p>
            </div>
          )}

          {/* Indicaciones */}
          {product.indicaciones && product.indicaciones.length > 0 && (
            <div>
              <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Indicaciones</h3>
              <ul className="space-y-2">
                {product.indicaciones.slice(0, 8).map((ind: string, i: number) => (
                  <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    {ind}
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Categoría */}
          {product.categoria_principal && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">Categoría:</span>
              <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
                {product.categoria_principal}
              </span>
            </div>
          )}

          {/* Sinergias */}
          {sinergias.length > 0 && (
            <div className="border-t border-gray-100 pt-4">
              <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">
                Sinergias Detectadas ({sinergias.length})
              </h3>
              <div className="flex flex-wrap gap-2">
                {sinergias.map((sin: string, i: number) => (
                  <span 
                    key={i} 
                    className="px-3 py-1.5 bg-violet-50 text-violet-600 text-xs font-medium rounded-full"
                  >
                    {sin}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {/* Metadatos */}
          <div className="text-xs text-gray-400 border-t border-gray-100 pt-4 space-y-1">
            <p>SKU: {product.sku}</p>
            {product.updated_at && (
              <p>Última actualización: {new Date(product.updated_at).toLocaleDateString('es-ES')}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ==================== MAIN COMPONENT ====================

export function DashboardSimple() {
  const [loading, setLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState('Cargando...');
  const [products, setProducts] = useState<AnalyzedProduct[]>([]);
  const [view, setView] = useState<ViewType>('buscar');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('todas');
  const [selectedProduct, setSelectedProduct] = useState<AnalyzedProduct | null>(null);
  const [scrapeStates, setScrapeStates] = useState<ScrapingState>({});
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({ status: 'idle' });
  const [kbStats, setKbStats] = useState({ total: 0, families: 0, types: 0 });

  const kb = useMemo(() => getCombinedKnowledgeBase(), []);
  const supabaseConnected = supabaseService.isConfigured();

  // Sincronizar KB con Supabase al iniciar
  useEffect(() => {
    const syncKb = async () => {
      if (!supabaseConnected) {
        console.log('[Dashboard] Supabase no conectado, usando KB local');
        setKbStats(knowledgeSyncService.getStats());
        return;
      }

      // Registrar listener de sincronización
      const unsubscribe = knowledgeSyncService.addSyncListener((status) => {
        setSyncStatus(status);
        if (status.status === 'synced') {
          setKbStats(knowledgeSyncService.getStats());
        }
      });

      // Verificar si necesita sincronización
      if (knowledgeSyncService.needsSync()) {
        console.log('[Dashboard] Iniciando sincronización de KB...');
        const result = await knowledgeSyncService.sync();
        if (result.success) {
          setKbStats(knowledgeSyncService.getStats());
        }
      } else {
        setKbStats(knowledgeSyncService.getStats());
      }

      return unsubscribe;
    };

    syncKb();
  }, [supabaseConnected]);

  // Función para forzar sincronización
  const handleSyncKb = useCallback(async () => {
    if (!supabaseConnected) {
      alert('Conecta Supabase para sincronizar la base de conocimiento');
      return;
    }
    const result = await knowledgeSyncService.sync();
    if (result.success) {
      setKbStats(knowledgeSyncService.getStats());
    } else {
      alert('Error sincronizando: ' + result.error);
    }
  }, [supabaseConnected]);
  
  // Función para hacer scraping on-demand de un producto
  const handleScrapeProduct = useCallback(async (sku: string) => {
    if (scrapeStates[sku] === 'scraping') return;
    
    // Limpiar SKU de caracteres extraños
    const cleanSku = sku.trim().split(' ')[0].split('\n')[0];
    if (!cleanSku || cleanSku.length < 5) {
      logger.warn(`SKU inválido: ${sku}`, 'Dashboard');
      return;
    }
    
    setScrapeStates(prev => ({ ...prev, [sku]: 'scraping' }));
    logger.info(`Iniciando scraping para SKU: ${cleanSku}`, 'Dashboard');
    
    try {
      // Intentar primero con el backend local/desplegado
      let result = null;
      
      try {
        const response = await fetch(`/api/scrape-product?sku=${encodeURIComponent(cleanSku)}`);
        if (response.ok) {
          result = await response.json();
        }
      } catch (apiError) {
        console.log('[Scraping] API no disponible, usando fetch directo');
      }
      
      // Si no funciona el API, usar fetch directo
      if (!result || !result.success) {
        // Scraping directo usando fetch hacia Farmacias Knop
        const searchUrl = `https://www.farmaciasknop.com/catalogsearch/result?q=${encodeURIComponent(cleanSku)}`;
        
        try {
          const response = await fetch(searchUrl);
          const html = await response.text();
          
          // Parsear HTML con DOM
          const parser = new DOMParser();
          const doc = parser.parseFromString(html, 'text/html');
          
          // Buscar el primer producto
          const productLink = doc.querySelector('.product-item a, .vtex-product-summary-2-x-productLink, .items-list .item a');
          
          if (productLink) {
            const productUrl = productLink.getAttribute('href');
            if (productUrl) {
              // Obtener datos del producto
              const productResponse = await fetch(productUrl);
              const productHtml = await productResponse.text();
              const productDoc = parser.parseFromString(productHtml, 'text/html');
              
              // Extraer datos
              const nombre = productDoc.querySelector('h1.page-title span, .vtex-store-components-3-x-productNameContainer span, h1')?.textContent?.trim();
              const skuText = productDoc.querySelector('[itemprop="sku"], .sku .value, .product-code')?.textContent?.trim();
              const marca = productDoc.querySelector('.product-brand, [itemprop="brand"], .vtex-store-components-3-x-productBrand')?.textContent?.trim();
              const descripcion = productDoc.querySelector('.product.attribute.description, #description')?.textContent?.trim()?.substring(0, 500);
              const imagen = productDoc.querySelector('.product-image-photo, .vtex-store-components-3-x-productImage')?.getAttribute('src');
              const precio = productDoc.querySelector('[itemprop="price"], .price-wrapper .price')?.textContent?.trim();
              const categoria = productDoc.querySelector('.breadcrumbs .current:last-child, .vtex-breadcrumb-1-x-current')?.textContent?.trim();
              
              if (nombre) {
                result = {
                  success: true,
                  datos: {
                    nombre_comercial: nombre,
                    sku: skuText || cleanSku,
                    marca: marca,
                    descripcion: descripcion,
                    precio: precio,
                    categoria: categoria,
                    imagen_url: imagen,
                    principios_activos: [],
                    indicaciones: []
                  }
                };
              }
            }
          }
        } catch (fetchError) {
          console.error('[Scraping] Error en fetch directo:', fetchError);
        }
      }
      
      if (result?.success && result.datos) {
        // Actualizar el producto con los datos encontrados
        setProducts(prev => prev.map(p => {
          if (p.sku === sku) {
            return {
              ...p,
              nombre_comercial: result.datos.nombre_comercial || p.nombre_comercial,
              descripcion: result.datos.descripcion || p.descripcion,
              marca: result.datos.marca || p.marca,
              categoria_principal: result.datos.categoria || p.categoria_principal,
              precio: result.datos.precio || p.precio,
              imagen_url: result.datos.imagen_url || p.imagen_url,
              principios_activos: result.datos.principios_activos?.length > 0 
                ? result.datos.principios_activos 
                : p.principios_activos,
            };
          }
          return p;
        }));
        
        setScrapeStates(prev => ({ ...prev, [sku]: 'success' }));
        logger.info(`Scraping completado para SKU: ${sku}`, 'Dashboard');
        
        setTimeout(() => {
          setScrapeStates(prev => ({ ...prev, [sku]: 'idle' }));
        }, 2000);
      } else {
        setScrapeStates(prev => ({ ...prev, [sku]: 'error' }));
        logger.warn(`Scraping falló para SKU: ${sku}`, 'Dashboard');
        
        setTimeout(() => {
          setScrapeStates(prev => ({ ...prev, [sku]: 'idle' }));
        }, 3000);
      }
    } catch (error) {
      setScrapeStates(prev => ({ ...prev, [sku]: 'error' }));
      logger.error(`Error en scraping para SKU: ${sku}`, error);
      
      setTimeout(() => {
        setScrapeStates(prev => ({ ...prev, [sku]: 'idle' }));
      }, 3000);
    }
  }, [scrapeStates]);

  // Extraer categorías
  const categories = useMemo(() => {
    const cats = new Set<string>();
    products.forEach(p => {
      if (p.categoria_principal) cats.add(p.categoria_principal);
      if (p.categoria) cats.add(p.categoria);
    });
    return Array.from(cats).sort();
  }, [products]);

  // Stats
  const stats = useMemo(() => {
    const total = products.length;
    const kbMatch = products.filter(p => p.cobertura_kb > 0).length;
    const sinergias = products.filter(p => (p.sinergias_detectadas?.length || 0) > 0).length;
    return { total, kbMatch, sinergias };
  }, [products]);

  // Cargar productos
  useEffect(() => {
    const loadProducts = async () => {
      setLoading(true);
      setLoadingMessage('Inicializando...');
      
      try {
        // Esperar a que el índice esté listo
        await searchService.initializeIndex();
        const indexedProducts = searchService.getAllIndexedProducts();
        
        if (indexedProducts.length > 0) {
          logger.info(`Cargando ${indexedProducts.length} productos`, 'Dashboard');
          
          const analyzed = indexedProducts.map((product: Product) => {
            const { found, sinergias, kbAnalysis } = analyzeProduct(product, kb);
            const principiosCount = (product.principios_activos || []).length;
            const cobertura = principiosCount > 0 ? Math.round((found.length / principiosCount) * 100) : 0;
            return {
              ...product,
              ingredientes_encontrados: found,
              cobertura_kb: Math.min(cobertura, 100),
              sinergias_detectadas: sinergias,
              kbAnalysis
            };
          });
          
          setProducts(analyzed);
        } else {
          // Fallback a DataService
          const fromService = await dataService.getAllProducts();
          if (fromService.length > 0) {
            const analyzed = fromService.map((product: Product) => {
              const { found, sinergias, kbAnalysis } = analyzeProduct(product, kb);
              const principiosCount = (product.principios_activos || []).length;
              const cobertura = principiosCount > 0 ? Math.round((found.length / principiosCount) * 100) : 0;
              return {
                ...product,
                ingredientes_encontrados: found,
                cobertura_kb: Math.min(cobertura, 100),
                sinergias_detectadas: sinergias,
                kbAnalysis
              };
            });
            setProducts(analyzed);
          }
        }
      } catch (error) {
        logger.error('Error cargando productos', error);
      }
      
      setLoading(false);
    };

    loadProducts();
  }, [kb]);

  // Keyboard shortcut: Ctrl+K para focus en búsqueda
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        document.querySelector<HTMLInputElement>('input[placeholder="Buscar medicamento..."]')?.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center mx-auto mb-3">
            <Pill className="w-5 h-5 text-white" />
          </div>
          <p className="text-sm text-gray-500">{loadingMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <HeaderSimple 
        productCount={stats.total} 
        connected={supabaseConnected}
        query={searchQuery}
        onQueryChange={setSearchQuery}
      />
      
      <div className="flex-1 flex">
        <Sidebar 
          active={view} 
          onChange={setView}
          stats={stats}
        />
        
        <main className="flex-1 p-4 max-w-4xl">
          <div className="animate-fade-in">
            {view === 'buscar' && (
              <SearchView 
                products={products}
                kb={kb}
                query={searchQuery}
                categories={categories}
                selectedCategory={selectedCategory}
                onCategoryChange={setSelectedCategory}
                onSelectProduct={setSelectedProduct}
                onScrapeProduct={handleScrapeProduct}
                scrapeStates={scrapeStates}
              />
            )}
            
            {view === 'catalogo' && (
              <CatalogView 
                stats={stats} 
                kbStats={kbStats}
                syncStatus={syncStatus}
                onSync={handleSyncKb}
              />
            )}
            
            {view === 'sinergias' && <SynergyView kb={kb} />}
            
            {view === 'ajustes' && <SettingsView connected={supabaseConnected} />}
          </div>
        </main>
      </div>

      {selectedProduct && (
        <ProductDetailModal 
          product={selectedProduct} 
          kb={kb}
          onClose={() => setSelectedProduct(null)}
          onScrape={handleScrapeProduct}
          scrapeState={scrapeStates[selectedProduct.sku] || 'idle'}
        />
      )}
    </div>
  );
}

export default DashboardSimple;
