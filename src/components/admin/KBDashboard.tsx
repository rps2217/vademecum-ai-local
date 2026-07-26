/**
 * KBDashboard - Panel de Administración de Base de Conocimiento
 * 
 * Dashboard completo para gestionar ingredientes, sinergias,
 * visualizar la red de conocimiento y estadísticas.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Database, Network, BarChart3, Users, 
  Plus, Edit2, Trash2, Search, Filter,
  ChevronRight, ChevronDown, RefreshCw,
  AlertTriangle, CheckCircle, Info,
  BookOpen, Sparkles, GitBranch
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { knowledgeLoader } from '../../core/knowledge-base';
import { synergyEngineV2 } from '../../core/knowledge-base';
import { supabaseKBService } from '../../services/SupabaseKBService';
import SynergyGraph from './SynergyGraph';
import IngredientEditor from './IngredientEditor';

type TabType = 'overview' | 'ingredients' | 'synergies' | 'sync';

interface KBDashboardProps {
  onClose?: () => void;
}

export default function KBDashboard({ onClose }: KBDashboardProps) {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [loading, setLoading] = useState(true);
  const [syncStats, setSyncStats] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedIngredient, setSelectedIngredient] = useState<any>(null);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      await knowledgeLoader.load();
      const stats = await supabaseKBService.getSyncStats();
      setSyncStats(stats);
    } catch (error) {
      console.error('Error loading KB data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const result = await supabaseKBService.syncAll();
      await loadData();
      alert(`Sincronización completada:\n- ${result.uploaded} subidos\n- ${result.downloaded} descargados`);
    } catch (error) {
      alert('Error durante la sincronización');
    } finally {
      setSyncing(false);
    }
  };

  const stats = useMemo(() => {
    if (loading) return null;
    return knowledgeLoader.getStats();
  }, [loading]);

  const filteredIngredients = useMemo(() => {
    if (loading) return [];
    let ingredients = knowledgeLoader.getAll();
    
    if (selectedCategory !== 'all') {
      ingredients = ingredients.filter(i => i.categoria === selectedCategory);
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      ingredients = ingredients.filter(i => 
        i.nombre.toLowerCase().includes(query) ||
        i.nombreCientifico?.toLowerCase().includes(query) ||
        i.nombresAlternativos?.some((n: string) => n.toLowerCase().includes(query))
      );
    }
    
    return ingredients;
  }, [loading, selectedCategory, searchQuery]);

  const categories = [
    { id: 'all', name: 'Todos', count: stats?.total || 0 },
    { id: 'fitoterapia', name: 'Fitoterapia', count: stats?.byCategory?.fitoterapia || 0 },
    { id: 'homeopatia', name: 'Homeopatía', count: stats?.byCategory?.homeopatia || 0 },
    { id: 'aceite_esencial', name: 'Aceites', count: stats?.byCategory?.aceite_esencial || 0 },
    { id: 'vitaminas', name: 'Vitaminas', count: stats?.byCategory?.vitaminas || 0 },
    { id: 'minerales', name: 'Minerales', count: stats?.byCategory?.minerales || 0 },
  ];

  const tabs = [
    { id: 'overview', label: 'Resumen', icon: BarChart3 },
    { id: 'ingredients', label: 'Ingredientes', icon: Database },
    { id: 'synergies', label: 'Sinergias', icon: Network },
    { id: 'sync', label: 'Sincronización', icon: RefreshCw },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-emerald-600 mx-auto mb-4" />
          <p className="text-gray-600">Cargando base de conocimiento...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                <Database className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Base de Conocimiento</h1>
                <p className="text-sm text-gray-500">Administración y análisis</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={loadData}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Actualizar"
              >
                <RefreshCw className="w-5 h-5 text-gray-600" />
              </button>
              {onClose && (
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-gray-700"
                >
                  Cerrar
                </button>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mt-4 bg-slate-100 p-1 rounded-lg w-fit">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                  activeTab === tab.id
                    ? "bg-white text-emerald-700 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                )}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {activeTab === 'overview' && (
          <OverviewTab stats={stats} syncStats={syncStats} categories={categories} />
        )}
        
        {activeTab === 'ingredients' && (
          <IngredientsTab
            ingredients={filteredIngredients}
            categories={categories}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            onSelectIngredient={setSelectedIngredient}
          />
        )}
        
        {activeTab === 'synergies' && (
          <SynergiesTab />
        )}
        
        {activeTab === 'sync' && (
          <SyncTab syncStats={syncStats} syncing={syncing} onSync={handleSync} />
        )}
      </div>

      {/* Ingredient Detail Modal */}
      {selectedIngredient && (
        <IngredientEditor
          ingredient={selectedIngredient}
          onClose={() => setSelectedIngredient(null)}
          onSave={loadData}
        />
      )}
    </div>
  );
}

// ==================== OVERVIEW TAB ====================

function OverviewTab({ stats, syncStats, categories }: any) {
  const categoryColors: Record<string, string> = {
    fitoterapia: 'bg-emerald-500',
    homeopatia: 'bg-violet-500',
    aceite_esencial: 'bg-amber-500',
    vitaminas: 'bg-blue-500',
    minerales: 'bg-slate-500',
  };

  const systemColors: Record<string, string> = {
    nervioso: 'text-purple-600 bg-purple-50',
    digestivo: 'text-amber-600 bg-amber-50',
    inmune: 'text-emerald-600 bg-emerald-50',
    cardiovascular: 'text-red-600 bg-red-50',
    respiratorio: 'text-cyan-600 bg-cyan-50',
    musculoesqueletico: 'text-orange-600 bg-orange-50',
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Ingredientes"
          value={stats?.total || 0}
          icon={Database}
          color="text-emerald-600 bg-emerald-50"
        />
        <StatCard
          title="Sinergias Curadas"
          value={stats?.totalSynergies || 0}
          icon={Sparkles}
          color="text-violet-600 bg-violet-50"
        />
        <StatCard
          title="Sistemas Corporales"
          value={Object.keys(stats?.bySystem || {}).length}
          icon={GitBranch}
          color="text-blue-600 bg-blue-50"
        />
        <StatCard
          title="Estado Sync"
          value={syncStats?.status === 'synced' ? 'Sincronizado' : 'Local'}
          icon={CheckCircle}
          color={syncStats?.status === 'synced' ? 'text-emerald-600 bg-emerald-50' : 'text-gray-600 bg-gray-50'}
        />
      </div>

      {/* Categories Breakdown */}
      <div className="bg-white rounded-xl border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-emerald-600" />
          Ingredientes por Categoría
        </h3>
        <div className="space-y-3">
          {categories.filter(c => c.id !== 'all').map(cat => (
            <div key={cat.id} className="flex items-center gap-3">
              <div className={cn("w-3 h-3 rounded-full", categoryColors[cat.id] || 'bg-gray-400')} />
              <span className="flex-1 text-gray-700">{cat.name}</span>
              <span className="text-gray-500">{cat.count}</span>
              <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={cn("h-full rounded-full", categoryColors[cat.id] || 'bg-gray-400')}
                  style={{ width: `${(cat.count / (stats?.total || 1)) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top Systems */}
      <div className="bg-white rounded-xl border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Sistemas Corporales Más Cubiertos</h3>
        <div className="flex flex-wrap gap-2">
          {Object.entries(stats?.bySystem || {})
            .sort(([, a], [, b]) => (b as number) - (a as number))
            .slice(0, 8)
            .map(([system, count]) => (
              <span
                key={system}
                className={cn(
                  "px-3 py-1.5 rounded-full text-sm font-medium",
                  systemColors[system] || 'text-gray-600 bg-gray-50'
                )}
              >
                {system.replace(/_/g, ' ')} ({count})
              </span>
            ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <QuickAction
          title="Añadir Ingrediente"
          description="Agregar nuevo ingrediente a la base"
          icon={Plus}
          color="bg-emerald-500"
          onClick={() => {}}
        />
        <QuickAction
          title="Crear Sinergia"
          description="Definir nueva relación sinérgica"
          icon={Sparkles}
          color="bg-violet-500"
          onClick={() => {}}
        />
        <QuickAction
          title="Exportar Datos"
          description="Descargar base de conocimiento"
          icon={Database}
          color="bg-blue-500"
          onClick={() => {}}
        />
      </div>
    </div>
  );
}

// ==================== INGREDIENTS TAB ====================

function IngredientsTab({
  ingredients,
  categories,
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
  onSelectIngredient
}: any) {
  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white rounded-xl border p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar ingredientes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>
          
          {/* Category Filter */}
          <div className="flex gap-2 flex-wrap">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={cn(
                  "px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  selectedCategory === cat.id
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                )}
              >
                {cat.name} ({cat.count})
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results Count */}
      <p className="text-gray-500 text-sm">
        Mostrando {ingredients.length} ingrediente{ingredients.length !== 1 ? 's' : ''}
      </p>

      {/* Ingredients List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {ingredients.map((ing: any) => (
          <div
            key={ing.id}
            onClick={() => onSelectIngredient(ing)}
            className="bg-white rounded-xl border p-4 cursor-pointer hover:border-emerald-300 hover:shadow-md transition-all"
          >
            <div className="flex items-start justify-between mb-2">
              <h4 className="font-semibold text-gray-900">{ing.nombre}</h4>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                {ing.categoria}
              </span>
            </div>
            {ing.nombreCientifico && (
              <p className="text-xs text-gray-500 italic mb-2">{ing.nombreCientifico}</p>
            )}
            <p className="text-sm text-gray-600 line-clamp-2">{ing.descripcion}</p>
            {ing.indicaciones && ing.indicaciones.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {ing.indicaciones.slice(0, 3).map((ind: string) => (
                  <span key={ind} className="text-xs px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded">
                    {ind}
                  </span>
                ))}
                {ing.indicaciones.length > 3 && (
                  <span className="text-xs text-gray-400">+{ing.indicaciones.length - 3}</span>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {ingredients.length === 0 && (
        <div className="text-center py-12">
          <Database className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No se encontraron ingredientes</p>
        </div>
      )}
    </div>
  );
}

// ==================== SYNERGIES TAB ====================

function SynergiesTab() {
  const [viewMode, setViewMode] = useState<'graph' | 'list'>('graph');

  return (
    <div className="space-y-6">
      {/* View Mode Toggle */}
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900">Red de Sinergias</h2>
        <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setViewMode('graph')}
            className={cn(
              "px-3 py-1.5 rounded text-sm font-medium transition-colors",
              viewMode === 'graph' ? "bg-white shadow text-emerald-700" : "text-gray-600"
            )}
          >
            Grafo
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={cn(
              "px-3 py-1.5 rounded text-sm font-medium transition-colors",
              viewMode === 'list' ? "bg-white shadow text-emerald-700" : "text-gray-600"
            )}
          >
            Lista
          </button>
        </div>
      </div>

      {viewMode === 'graph' ? (
        <SynergyGraph />
      ) : (
        <SynergiesList />
      )}
    </div>
  );
}

function SynergiesList() {
  const [synergies, setSynergies] = useState<any[]>([]);
  
  useEffect(() => {
    setSynergies(knowledgeLoader.getAllSynergies());
  }, []);

  const typeColors: Record<string, string> = {
    potenciador: 'bg-emerald-100 text-emerald-700',
    complementario: 'bg-blue-100 text-blue-700',
    cofactor: 'bg-violet-100 text-violet-700',
    bioactivador: 'bg-amber-100 text-amber-700',
    secuencial: 'bg-cyan-100 text-cyan-700',
  };

  const evidenceColors: Record<string, string> = {
    'A': 'bg-green-100 text-green-700',
    'B': 'bg-blue-100 text-blue-700',
    'C': 'bg-gray-100 text-gray-700',
    'D': 'bg-orange-100 text-orange-700',
  };

  return (
    <div className="space-y-4">
      {synergies.map(syn => {
        const ingA = knowledgeLoader.getById(syn.ingredienteA);
        const ingB = knowledgeLoader.getById(syn.ingredienteB);
        
        return (
          <div key={syn.id} className="bg-white rounded-xl border p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-emerald-500" />
                <div>
                  <h4 className="font-medium text-gray-900">
                    {ingA?.nombre || syn.ingredienteA} + {ingB?.nombre || syn.ingredienteB}
                  </h4>
                  <div className="flex gap-2 mt-1">
                    <span className={cn("text-xs px-2 py-0.5 rounded-full", typeColors[syn.tipo] || 'bg-gray-100')}>
                      {syn.tipo}
                    </span>
                    <span className={cn("text-xs px-2 py-0.5 rounded-full", evidenceColors[syn.nivelEvidencia] || 'bg-gray-100')}>
                      Evidencia {syn.nivelEvidencia}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-3">{syn.descripcion}</p>
            {syn.beneficios && syn.beneficios.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-gray-500">Beneficios:</p>
                <ul className="text-sm text-gray-700 space-y-1">
                  {syn.beneficios.map((b: string, i: number) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ==================== SYNC TAB ====================

function SyncTab({ syncStats, syncing, onSync }: any) {
  const isSupabaseConfigured = supabaseKBService.isConfigured?.() || false;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white rounded-xl border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Estado de Sincronización</h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
            <span className="text-gray-700">Ingredientes Locales</span>
            <span className="font-semibold">{syncStats?.localIngredients || 0}</span>
          </div>
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
            <span className="text-gray-700">Ingredientes en Nube</span>
            <span className="font-semibold">{syncStats?.remoteIngredients || 0}</span>
          </div>
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
            <span className="text-gray-700">Sinergias Locales</span>
            <span className="font-semibold">{syncStats?.localSynergies || 0}</span>
          </div>
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
            <span className="text-gray-700">Última Sincronización</span>
            <span className="font-semibold">
              {syncStats?.lastSync 
                ? new Date(syncStats.lastSync).toLocaleString()
                : 'Nunca'}
            </span>
          </div>
        </div>

        {!isSupabaseConfigured ? (
          <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
              <div>
                <p className="font-medium text-amber-800">Supabase no configurado</p>
                <p className="text-sm text-amber-700 mt-1">
                  Añade las variables de entorno VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY para activar la sincronización.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <button
            onClick={onSync}
            disabled={syncing}
            className="mt-6 w-full py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {syncing ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                Sincronizando...
              </>
            ) : (
              <>
                <RefreshCw className="w-5 h-5" />
                Sincronizar Ahora
              </>
            )}
          </button>
        )}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium">Acerca de la sincronización</p>
            <p className="mt-1">
              La sincronización sube tus datos locales a Supabase y descarga cualquier actualización 
              desde la nube. Los datos locales tienen prioridad en caso de conflictos.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==================== HELPER COMPONENTS ====================

function StatCard({ title, value, icon: Icon, color }: any) {
  return (
    <div className="bg-white rounded-xl border p-4">
      <div className="flex items-center gap-3">
        <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", color)}>
          <Icon className="w-6 h-6" />
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          <p className="text-sm text-gray-500">{title}</p>
        </div>
      </div>
    </div>
  );
}

function QuickAction({ title, description, icon: Icon, color, onClick }: any) {
  return (
    <button
      onClick={onClick}
      className="bg-white rounded-xl border p-4 text-left hover:border-emerald-300 hover:shadow-md transition-all group"
    >
      <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center mb-3", color)}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <h4 className="font-semibold text-gray-900 group-hover:text-emerald-700 transition-colors">{title}</h4>
      <p className="text-sm text-gray-500 mt-1">{description}</p>
    </button>
  );
}

export default KBDashboard;
