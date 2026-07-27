/**
 * KBDashboard - Panel de Administración de Base de Conocimiento
 * 
 * Dashboard completo para gestionar ingredientes, sinergias y configuraciones
 * de la base de conocimiento de Vademecum AI.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { knowledgeLoader } from '../../core/knowledge-base';
import { synergyEngineV2 } from '../../core/synergy/SynergyEngineV2';
import { logger } from '../../services/LoggerService';
import { cn } from '../../lib/utils';
import { 
  Search, Plus, Edit2, Trash2, Download, Upload, 
  Filter, ChevronLeft, ChevronRight, X, Check,
  Database, Link2, BarChart3, Settings, 
  AlertTriangle, Info, RefreshCw, ChevronDown
} from 'lucide-react';

// Tipos
interface Ingredient {
  id: string;
  nombre: string;
  categoria: string;
  familia: string;
  tipo: string;
  propiedades: string[];
  sinonimos: string[];
  sinergias: string[];
  antagonismos: string[];
  contraindicaciones: string[];
  notas: string;
  [key: string]: any;
}

interface Stats {
  total: number;
  byCategory: Record<string, number>;
  byFamily: Record<string, number>;
  synergies: number;
  antagonists: number;
}

// Categorías disponibles
const CATEGORIAS = [
  { id: 'fitoterapia', label: 'Fitoterapia', color: '#10b981' },
  { id: 'homeopatia', label: 'Homeopatía', color: '#8b5cf6' },
  { id: 'aceite_esencial', label: 'Aceite Esencial', color: '#f59e0b' },
  { id: 'vitaminas', label: 'Vitaminas', color: '#3b82f6' },
  { id: 'minerales', label: 'Minerales', color: '#64748b' },
  { id: 'aminoacidos', label: 'Aminoácidos', color: '#2563eb' },
  { id: 'probioticos', label: 'Probióticos', color: '#0d9488' },
];

const ITEMS_PER_PAGE = 20;

export default function KBDashboard() {
  // State
  const [activeTab, setActiveTab] = useState<'ingredients' | 'synergies' | 'stats' | 'settings'>('ingredients');
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIngredient, setSelectedIngredient] = useState<Ingredient | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [stats, setStats] = useState<Stats>({ total: 0, byCategory: {}, byFamily: {}, synergies: 0, antagonists: 0 });
  const [showFilters, setShowFilters] = useState(false);

  // Form state
  const [formData, setFormData] = useState<Partial<Ingredient>>({});

  useEffect(() => {
    loadData();
  }, []);

  const showToast = (message: string, type: 'success' | 'error' | 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadData = () => {
    try {
      const allIngredients = knowledgeLoader.getAll() as Ingredient[];
      const allSynergies = synergyEngineV2.getAllSynergies();
      
      setIngredients(allIngredients);
      
      // Calcular estadísticas
      const byCategory: Record<string, number> = {};
      const byFamily: Record<string, number> = {};
      let synergies = 0;
      let antagonists = 0;

      allIngredients.forEach(ing => {
        byCategory[ing.categoria] = (byCategory[ing.categoria] || 0) + 1;
        byFamily[ing.familia] = (byFamily[ing.familia] || 0) + 1;
        synergies += (ing.sinergias?.length || 0);
        antagonismos += (ing.antagonismos?.length || 0);
      });

      setStats({
        total: allIngredients.length,
        byCategory,
        byFamily,
        synergies: allSynergies.length,
        antagonists: 0,
      });

      logger.info(`KB cargada: ${allIngredients.length} ingredientes`, 'KBDashboard');
    } catch (error) {
      logger.error('Error cargando KB', 'KBDashboard', error);
      showToast('Error al cargar datos', 'error');
    }
  };

  // Filtrado
  const filteredIngredients = useMemo(() => {
    return ingredients.filter(ing => {
      const matchesSearch = !searchQuery || 
        ing.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ing.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ing.sinonimos?.some((s: string) => s.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesCategory = !categoryFilter || ing.categoria === categoryFilter;
      
      return matchesSearch && matchesCategory;
    });
  }, [ingredients, searchQuery, categoryFilter]);

  // Paginación
  const totalPages = Math.ceil(filteredIngredients.length / ITEMS_PER_PAGE);
  const paginatedIngredients = filteredIngredients.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Handlers
  const handleCreate = () => {
    setFormData({
      id: '',
      nombre: '',
      categoria: 'fitoterapia',
      familia: '',
      tipo: '',
      propiedades: [],
      sinonimos: [],
      sinergias: [],
      antagonismos: [],
      contraindicaciones: [],
      notas: '',
    });
    setIsCreating(true);
    setIsEditing(true);
  };

  const handleEdit = (ingredient: Ingredient) => {
    setFormData({ ...ingredient });
    setSelectedIngredient(ingredient);
    setIsEditing(true);
  };

  const handleSave = () => {
    if (!formData.nombre || !formData.id) {
      showToast('Nombre e ID son requeridos', 'error');
      return;
    }

    // Validar ID único
    const exists = ingredients.find(i => i.id === formData.id && i.id !== selectedIngredient?.id);
    if (exists) {
      showToast('Ya existe un ingrediente con este ID', 'error');
      return;
    }

    try {
      if (isCreating) {
        // En producción, esto guardaría en Supabase/BD
        setIngredients([...ingredients, formData as Ingredient]);
        showToast('Ingrediente creado', 'success');
        logger.info(`Ingrediente creado: ${formData.nombre}`, 'KBDashboard');
      } else {
        setIngredients(ingredients.map(i => 
          i.id === selectedIngredient?.id ? formData as Ingredient : i
        ));
        showToast('Ingrediente actualizado', 'success');
        logger.info(`Ingrediente actualizado: ${formData.nombre}`, 'KBDashboard');
      }
      setIsEditing(false);
      setIsCreating(false);
      setSelectedIngredient(null);
      loadData();
    } catch (error) {
      logger.error('Error guardando ingrediente', 'KBDashboard', error);
      showToast('Error al guardar', 'error');
    }
  };

  const handleDelete = () => {
    if (!selectedIngredient) return;
    
    try {
      setIngredients(ingredients.filter(i => i.id !== selectedIngredient.id));
      showToast('Ingrediente eliminado', 'success');
      logger.info(`Ingrediente eliminado: ${selectedIngredient.nombre}`, 'KBDashboard');
      setSelectedIngredient(null);
      setShowDeleteConfirm(false);
      loadData();
    } catch (error) {
      logger.error('Error eliminando ingrediente', 'KBDashboard', error);
      showToast('Error al eliminar', 'error');
    }
  };

  const handleExport = () => {
    const data = JSON.stringify(ingredients, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vademecum-kb-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Datos exportados', 'success');
  };

  const getCategoryColor = (categoria: string) => {
    return CATEGORIAS.find(c => c.id === categoria)?.color || '#64748b';
  };

  const getCategoryLabel = (categoria: string) => {
    return CATEGORIAS.find(c => c.id === categoria)?.label || categoria;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Toast */}
      {toast && (
        <div className={cn(
          "fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-in slide-in-from-right",
          toast.type === 'success' && "bg-green-500 text-white",
          toast.type === 'error' && "bg-red-500 text-white",
          toast.type === 'info' && "bg-blue-500 text-white"
        )}>
          {toast.type === 'success' && <Check className="w-5 h-5" />}
          {toast.type === 'error' && <AlertTriangle className="w-5 h-5" />}
          {toast.type === 'info' && <Info className="w-5 h-5" />}
          <span className="font-medium">{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Database className="w-6 h-6 text-blue-600" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">Knowledge Base</h1>
                <p className="text-xs text-gray-500">{stats.total} ingredientes • {stats.synergies} sinergias</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={loadData}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Actualizar"
              >
                <RefreshCw className="w-5 h-5 text-gray-600" />
              </button>
              <button
                onClick={handleExport}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Exportar"
              >
                <Download className="w-5 h-5 text-gray-600" />
              </button>
              <button
                onClick={handleCreate}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Nuevo
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 -mb-px">
            {[
              { id: 'ingredients', label: 'Ingredientes', icon: Database },
              { id: 'synergies', label: 'Sinergias', icon: Link2 },
              { id: 'stats', label: 'Estadísticas', icon: BarChart3 },
              { id: 'settings', label: 'Configuración', icon: Settings },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2",
                  activeTab === tab.id
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-600 hover:text-gray-900"
                )}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {activeTab === 'ingredients' && (
          <div className="space-y-4">
            {/* Search & Filters */}
            <div className="bg-white rounded-xl border p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                    placeholder="Buscar por nombre, ID o sinónimo..."
                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div className="flex gap-2">
                  <select
                    value={categoryFilter}
                    onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(1); }}
                    className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Todas las categorías</option>
                    {CATEGORIAS.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.label}</option>
                    ))}
                  </select>
                  
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={cn(
                      "px-3 py-2 border rounded-lg flex items-center gap-2 transition-colors",
                      showFilters ? "bg-blue-50 border-blue-200 text-blue-700" : "hover:bg-gray-50"
                    )}
                  >
                    <Filter className="w-4 h-4" />
                    Filtros
                  </button>
                </div>
              </div>

              {/* Advanced Filters */}
              {showFilters && (
                <div className="mt-4 pt-4 border-t grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Familia</label>
                    <input
                      type="text"
                      placeholder="Ej: Vitamina"
                      className="w-full px-3 py-1.5 border rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Tipo</label>
                    <input
                      type="text"
                      placeholder="Ej: vitaminico"
                      className="w-full px-3 py-1.5 border rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Tiene sinergias</label>
                    <select className="w-full px-3 py-1.5 border rounded-lg text-sm">
                      <option value="">Cualquiera</option>
                      <option value="yes">Sí</option>
                      <option value="no">No</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Tiene advertencias</label>
                    <select className="w-full px-3 py-1.5 border rounded-lg text-sm">
                      <option value="">Cualquiera</option>
                      <option value="yes">Sí</option>
                      <option value="no">No</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ingrediente</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoría</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Familia</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Sinergias</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Antagonismos</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {paginatedIngredients.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                          No se encontraron ingredientes
                        </td>
                      </tr>
                    ) : (
                      paginatedIngredients.map(ing => (
                        <tr 
                          key={ing.id} 
                          className={cn(
                            "hover:bg-gray-50 cursor-pointer transition-colors",
                            selectedIngredient?.id === ing.id && "bg-blue-50"
                          )}
                          onClick={() => setSelectedIngredient(ing)}
                        >
                          <td className="px-4 py-3">
                            <div>
                              <p className="font-medium text-gray-900">{ing.nombre}</p>
                              <p className="text-xs text-gray-500">{ing.id}</p>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span 
                              className="px-2 py-1 rounded-full text-xs font-medium text-white"
                              style={{ backgroundColor: getCategoryColor(ing.categoria) }}
                            >
                              {getCategoryLabel(ing.categoria)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">{ing.familia || '-'}</td>
                          <td className="px-4 py-3 text-center">
                            <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                              {ing.sinergias?.length || 0}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={cn(
                              "px-2 py-1 rounded-full text-xs font-medium",
                              (ing.antagonismos?.length || 0) > 0 
                                ? "bg-red-100 text-red-700" 
                                : "bg-gray-100 text-gray-500"
                            )}>
                              {ing.antagonismos?.length || 0}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={(e) => { e.stopPropagation(); handleEdit(ing); }}
                                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                                title="Editar"
                              >
                                <Edit2 className="w-4 h-4 text-gray-600" />
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); setSelectedIngredient(ing); setShowDeleteConfirm(true); }}
                                className="p-1.5 hover:bg-red-50 rounded-lg transition-colors"
                                title="Eliminar"
                              >
                                <Trash2 className="w-4 h-4 text-red-600" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="px-4 py-3 border-t flex items-center justify-between">
                  <p className="text-sm text-gray-500">
                    Mostrando {(currentPage - 1) * ITEMS_PER_PAGE + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, filteredIngredients.length)} de {filteredIngredients.length}
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="p-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="px-3 py-1 text-sm">
                      Página {currentPage} de {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="p-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'synergies' && (
          <div className="bg-white rounded-xl border p-6">
            <div className="text-center py-12">
              <Link2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Gestión de Sinergias</h3>
              <p className="text-gray-500 mb-4">Usa el Editor Visual de Sinergias para gestionar las relaciones</p>
              <a 
                href="/synergy-editor" 
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Link2 className="w-4 h-4" />
                Abrir Editor Visual
              </a>
            </div>
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total */}
            <div className="bg-white rounded-xl border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Ingredientes</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <Database className="w-10 h-10 text-blue-600 opacity-20" />
              </div>
            </div>

            {/* Sinergias */}
            <div className="bg-white rounded-xl border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Sinergias</p>
                  <p className="text-3xl font-bold text-green-600">{stats.synergies}</p>
                </div>
                <Link2 className="w-10 h-10 text-green-600 opacity-20" />
              </div>
            </div>

            {/* Categorías */}
            <div className="bg-white rounded-xl border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Categorías</p>
                  <p className="text-3xl font-bold text-purple-600">{Object.keys(stats.byCategory).length}</p>
                </div>
                <BarChart3 className="w-10 h-10 text-purple-600 opacity-20" />
              </div>
            </div>

            {/* Familias */}
            <div className="bg-white rounded-xl border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Familias</p>
                  <p className="text-3xl font-bold text-orange-600">{Object.keys(stats.byFamily).length}</p>
                </div>
                <BarChart3 className="w-10 h-10 text-orange-600 opacity-20" />
              </div>
            </div>

            {/* Por categoría */}
            <div className="md:col-span-2 bg-white rounded-xl border p-6">
              <h3 className="font-medium text-gray-900 mb-4">Distribución por Categoría</h3>
              <div className="space-y-3">
                {Object.entries(stats.byCategory).map(([cat, count]) => (
                  <div key={cat} className="flex items-center gap-3">
                    <div className="w-24 text-sm text-gray-600">{getCategoryLabel(cat)}</div>
                    <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all"
                        style={{ 
                          width: `${(count / stats.total) * 100}%`,
                          backgroundColor: getCategoryColor(cat)
                        }}
                      />
                    </div>
                    <div className="w-12 text-sm text-gray-600 text-right">{count}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top familias */}
            <div className="md:col-span-2 bg-white rounded-xl border p-6">
              <h3 className="font-medium text-gray-900 mb-4">Top Familias</h3>
              <div className="space-y-2">
                {Object.entries(stats.byFamily)
                  .sort(([, a], [, b]) => (b as number) - (a as number))
                  .slice(0, 5)
                  .map(([family, count], i) => (
                    <div key={family} className="flex items-center justify-between py-1">
                      <span className="text-sm text-gray-600">{i + 1}. {family}</span>
                      <span className="px-2 py-0.5 bg-gray-100 rounded text-sm font-medium">{count as number}</span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border p-6">
              <h3 className="font-medium text-gray-900 mb-4">Configuración de Base de Conocimiento</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Supabase Sync</p>
                    <p className="text-sm text-gray-500">Sincronizar con base de datos en la nube</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-100 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Validación Estricta</p>
                    <p className="text-sm text-gray-500">Requerir campos obligatorios al crear ingredientes</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="pt-4 border-t">
                  <button className="px-4 py-2 border rounded-lg hover:bg-gray-50 flex items-center gap-2">
                    <Upload className="w-4 h-4" />
                    Importar datos JSON
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {isEditing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b flex items-center justify-between sticky top-0 bg-white">
              <h3 className="text-lg font-semibold text-gray-900">
                {isCreating ? 'Nuevo Ingrediente' : 'Editar Ingrediente'}
              </h3>
              <button
                onClick={() => { setIsEditing(false); setIsCreating(false); }}
                className="p-1 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ID *</label>
                  <input
                    type="text"
                    value={formData.id || ''}
                    onChange={(e) => setFormData({ ...formData, id: e.target.value.toLowerCase().replace(/\s/g, '-') })}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="nombre-ingrediente"
                    disabled={!isCreating}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                  <input
                    type="text"
                    value={formData.nombre || ''}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="Nombre del ingrediente"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                  <div className="relative">
                    <select
                      value={formData.categoria || ''}
                      onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg appearance-none"
                    >
                      {CATEGORIAS.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.label}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Familia</label>
                  <input
                    type="text"
                    value={formData.familia || ''}
                    onChange={(e) => setFormData({ ...formData, familia: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="Ej: Vitamina"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                <input
                  type="text"
                  value={formData.tipo || ''}
                  onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Ej: vitaminico, mineral, etc."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sinónimos (separados por coma)</label>
                <input
                  type="text"
                  value={formData.sinonimos?.join(', ') || ''}
                  onChange={(e) => setFormData({ ...formData, sinonimos: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="vitamina c, ascorbic acid"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
                <textarea
                  value={formData.notas || ''}
                  onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border rounded-lg resize-none"
                  placeholder="Notas adicionales..."
                />
              </div>
            </div>

            <div className="p-4 border-t bg-gray-50 flex justify-end gap-3 sticky bottom-0">
              <button
                onClick={() => { setIsEditing(false); setIsCreating(false); }}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 rounded-lg flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {showDeleteConfirm && selectedIngredient && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="p-6 text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Eliminar Ingrediente</h3>
              <p className="text-gray-500">
                ¿Estás seguro de eliminar <strong>{selectedIngredient.nombre}</strong>? Esta acción no se puede deshacer.
              </p>
            </div>
            <div className="p-4 border-t flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 text-sm font-medium bg-red-600 text-white hover:bg-red-700 rounded-lg"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
