/**
 * Vademecum AI - Aplicación Simplificada
 * Integrada con Supabase y Knowledge Base
 */

import React, { useState, useEffect, useMemo } from 'react';
import { getCombinedKnowledgeBase, getIngredientCount } from './core/knowledge-base';
import { synergyGraphService } from './core/knowledge-base/SynergyGraph';
import { Product } from './core/types/product.types';
import { supabaseService } from './services/SupabaseService';

// Tipos locales
interface AnalyzedProduct extends Product {
  ingredientes_encontrados: string[];
  cobertura_kb: number;
  sinergias_detectadas: string[];
}

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

function Header({ productCount, connected }: { productCount: number; connected: boolean }) {
  return (
    <header className="bg-emerald-600 text-white p-4">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Vademecum AI</h1>
          <p className="text-sm opacity-80">{productCount} productos • {getIngredientCount()} ingredientes KB</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`w-3 h-3 rounded-full ${connected ? 'bg-green-400' : 'bg-yellow-400'}`}></span>
          <span className="text-sm">{connected ? 'Nube' : 'Local'}</span>
        </div>
      </div>
    </header>
  );
}

function LoadingState({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600">{message}</p>
      </div>
    </div>
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
    <div className="flex flex-wrap gap-2 p-4 bg-gray-50 border-b">
      <button
        onClick={() => onSelect('todas')}
        className={`px-4 py-2 rounded-lg text-sm font-medium ${
          selected === 'todas' 
            ? 'bg-emerald-600 text-white' 
            : 'bg-white border text-gray-700 hover:bg-gray-100'
        }`}
      >
        Todas
      </button>
      {categories.map(cat => (
        <button
          key={cat}
          onClick={() => onSelect(cat)}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${
            selected === cat 
              ? 'bg-emerald-600 text-white' 
              : 'bg-white border text-gray-700 hover:bg-gray-100'
          }`}
        >
          {cat}
        </button>
      ))}
    </div>
  );
}

function IngredientCard({ 
  ingredient, 
  onClick 
}: { 
  ingredient: IngredientInfo; 
  onClick: () => void;
}) {
  const sinergias = synergyGraphService.obtenerSinergiasDe(ingredient.id);
  const sinergiasAltas = sinergias.filter(s => s.nivel === 'alto').length;
  
  return (
    <div 
      onClick={onClick}
      className="bg-white border rounded-lg p-4 cursor-pointer hover:border-emerald-500 hover:shadow-sm"
    >
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-semibold text-gray-900">{ingredient.nombre}</h3>
        <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">
          {ingredient.categoria}
        </span>
      </div>
      <p className="text-sm text-gray-600 line-clamp-2 mb-3">{ingredient.descripcion}</p>
      <div className="flex items-center gap-4 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <span className="text-emerald-600">+</span> {sinergias.length} sinergias
        </span>
        {sinergiasAltas > 0 && (
          <span className="text-emerald-600 font-medium">
            {sinergiasAltas} de alto nivel
          </span>
        )}
      </div>
    </div>
  );
}

function IngredientDetail({ 
  ingredient, 
  onClose 
}: { 
  ingredient: IngredientInfo; 
  onClose: () => void;
}) {
  const sinergias = synergyGraphService.obtenerSinergiasDe(ingredient.id);
  const antagonismos = synergyGraphService.obtenerAntagonismosDe(ingredient.id);
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{ingredient.nombre}</h2>
              <span className="text-sm bg-emerald-100 text-emerald-700 px-2 py-1 rounded mt-1 inline-block">
                {ingredient.categoria}
              </span>
            </div>
            <button 
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ×
            </button>
          </div>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">Descripción</h3>
              <p className="text-gray-700">{ingredient.descripcion}</p>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">Mecanismo de Acción</h3>
              <p className="text-gray-700">{ingredient.mecanismo_accion}</p>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Beneficios</h3>
              <ul className="grid grid-cols-2 gap-2">
                {ingredient.beneficios.map((b, i) => (
                  <li key={i} className="text-sm text-gray-700 flex items-center gap-2">
                    <span className="text-emerald-600">✓</span> {b}
                  </li>
                ))}
              </ul>
            </div>
            
            {ingredient.dosis_recomendada && (
              <div className="bg-blue-50 p-3 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-1">Dosis Recomendada</h3>
                <p className="text-blue-800">{ingredient.dosis_recomendada}</p>
              </div>
            )}
            
            {sinergias.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  Sinergias ({sinergias.length})
                </h3>
                <div className="space-y-2">
                  {sinergias.map(syn => (
                    <div key={syn.id} className="bg-emerald-50 p-3 rounded-lg flex justify-between items-center">
                      <div>
                        <span className="font-medium text-gray-900">{syn.hacia}</span>
                        <p className="text-sm text-gray-600">{syn.descripcion}</p>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
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
                <h3 className="font-semibold text-red-900 mb-2">
                  Precaución - Antagonismos ({antagonismos.length})
                </h3>
                <div className="space-y-2">
                  {antagonismos.map(ant => (
                    <div key={ant.id} className="bg-red-50 p-3 rounded-lg">
                      <span className="font-medium text-gray-900">{ant.hacia}</span>
                      <p className="text-sm text-red-700">{ant.descripcion}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {ingredient.contraindicaciones && ingredient.contraindicaciones.length > 0 && (
              <div>
                <h3 className="font-semibold text-orange-900 mb-2">Contraindicaciones</h3>
                <div className="bg-orange-50 p-3 rounded-lg">
                  {ingredient.contraindicaciones.map((c, i) => (
                    <p key={i} className="text-sm text-orange-800">
                      <strong>{c.condicion}:</strong> {c.descripcion}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function SearchBar({ onSearch }: { onSearch: (query: string) => void }) {
  const [query, setQuery] = useState("");
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query);
  };
  
  return (
    <form onSubmit={handleSubmit} className="p-4 bg-white border-b">
      <div className="max-w-6xl mx-auto">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar producto..."
          className="w-full p-3 border-2 border-gray-300 rounded-lg text-lg focus:border-emerald-500 focus:outline-none"
        />
      </div>
    </form>
  );
}

function StatsPanel() {
  const stats = getStats();
  
  return (
    <div className="p-4 bg-gray-50 border-b">
      <div className="max-w-6xl mx-auto">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Ingredientes por categoría</h3>
        <div className="flex flex-wrap gap-2">
          {Object.entries(stats).map(([cat, count]) => (
            <span key={cat} className="text-sm bg-white px-3 py-1 rounded border">
              {cat}: <strong>{count}</strong>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function SynergyFinder() {
  const [selected, setSelected] = useState<string[]>([]);
  const [results, setResults] = useState<IngredientInfo[]>([]);
  const kb = getCombinedKnowledgeBase();
  
  const toggleIngredient = (id: string) => {
    if (selected.includes(id)) {
      setSelected(selected.filter(s => s !== id));
    } else if (selected.length < 3) {
      setSelected([...selected, id]);
    }
  };
  
  useEffect(() => {
    if (selected.length >= 2) {
      // Encontrar ingredientes con sinergias entre los seleccionados
      const found: IngredientInfo[] = [];
      for (const id of selected) {
        const sinergias = synergyGraphService.obtenerSinergiasDe(id);
        for (const syn of sinergias) {
          if (selected.includes(syn.hacia) && !found.find(f => f.id === syn.hacia)) {
            const ing = kb[syn.hacia];
            if (ing) found.push(ing);
          }
        }
      }
      setResults(found);
    } else {
      setResults([]);
    }
  }, [selected]);
  
  return (
    <div className="p-4 bg-white border-t">
      <div className="max-w-6xl mx-auto">
        <h3 className="font-semibold text-gray-900 mb-3">
          Buscador de Sinergias (selecciona 2-3 ingredientes)
        </h3>
        
        <div className="flex flex-wrap gap-2 mb-4">
          {selected.map(id => {
            const ing = kb[id];
            return ing ? (
              <button
                key={id}
                onClick={() => toggleIngredient(id)}
                className="px-3 py-1 bg-emerald-600 text-white rounded-full text-sm flex items-center gap-1"
              >
                {ing.nombre}
                <span className="font-bold">×</span>
              </button>
            ) : null;
          })}
        </div>
        
        <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2 mb-4">
          {Object.entries(kb).slice(0, 50).map(([id, ing]) => (
            <button
              key={id}
              onClick={() => toggleIngredient(id)}
              disabled={!selected.includes(id) && selected.length >= 3}
              className={`p-2 text-xs rounded border text-left truncate ${
                selected.includes(id) 
                  ? 'bg-emerald-100 border-emerald-500' 
                  : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
              } ${!selected.includes(id) && selected.length >= 3 ? 'opacity-50' : ''}`}
            >
              {ing.nombre.split(' ')[0]}
            </button>
          ))}
        </div>
        
        {results.length > 0 && (
          <div className="bg-emerald-50 p-4 rounded-lg">
            <h4 className="font-semibold text-emerald-900 mb-2">
              Sinergias encontradas entre los seleccionados:
            </h4>
            <ul className="space-y-2">
              {results.map(ing => (
                <li key={ing.id} className="flex items-center gap-2 text-emerald-800">
                  <span className="text-emerald-600 font-bold">+</span>
                  {ing.nombre}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

// ==================== APP PRINCIPAL ====================

export default function AppSimple() {
  const [view, setView] = useState<'productos' | 'sinergias' | 'stats'>('productos');
  const [products, setProducts] = useState<AnalyzedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState('Conectando...');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('todas');
  const [selectedIngredient, setSelectedIngredient] = useState<IngredientInfo | null>(null);
  const [supabaseConnected, setSupabaseConnected] = useState(false);

  const kb = getCombinedKnowledgeBase();
  const categories = [...new Set(Object.values(kb).map(i => i.categoria))].sort();

  const filteredProducts = useMemo(() => {
    if (view === 'productos') {
      return products.filter(p => {
        const matchesCategory = selectedCategory === 'todas' || p.categoria_principal === selectedCategory;
        const matchesSearch = !searchQuery || 
          (p.nombre_comercial?.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (p.descripcion?.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (p.principios_activos || []).some((pa: string) => pa.toLowerCase().includes(searchQuery.toLowerCase()));
        return matchesCategory && matchesSearch;
      });
    }
    return products;
  }, [products, searchQuery, selectedCategory, view]);

  const stats = useMemo(() => ({
    total: products.length,
    withKbMatch: products.filter(p => (p.ingredientes_encontrados?.length || 0) > 0).length,
    withSynergies: products.filter(p => (p.sinergias_detectadas?.length || 0) > 0).length
  }), [products]);

  useEffect(() => {
    async function loadProducts() {
      console.log('[AppSimple] Cargando productos...');
      
      const supabase = supabaseService.getClient();
      console.log('[AppSimple] Supabase client:', supabase ? 'OK' : 'NULL');
      console.log('[AppSimple] Is configured:', supabaseService.isConfigured());
      
      if (!supabase) {
        console.log('[AppSimple] Sin Supabase, usando KB');
        setLoadingMessage('Sin conexión a la nube...');
        const kbProducts = Object.values(kb).map((ing: any) => ({
          sku: ing.id,
          nombre_comercial: ing.nombre,
          descripcion: ing.descripcion,
          principios_activos: [ing.nombre],
          categoria_principal: 'KB' as const,
          ingredientes_encontrados: [ing.id],
          cobertura_kb: 100,
          sinergias_detectadas: []
        }));
        setProducts(kbProducts as any);
        setLoading(false);
        return;
      }

      setSupabaseConnected(true);
      setLoadingMessage('Descargando productos de la nube...');

      try {
        console.log('[AppSimple] Fetching products from Supabase...');
        const { data, error } = await supabase.from('products').select('*').limit(200);
        console.log('[AppSimple] Data:', data?.length, 'products', 'Error:', error);

        if (error) {
          console.error('[AppSimple] Error:', error);
          setLoadingMessage('Error al cargar productos');
        } else if (data && data.length > 0) {
          console.log('[AppSimple] Analizando productos...');
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
          console.log('[AppSimple] Sin productos en la nube');
          setLoadingMessage('Sin productos en la nube...');
        }
      } catch (e) {
        console.error('[AppSimple] Exception:', e);
        setLoadingMessage('Error al conectar');
      }
      
      setLoading(false);
    }

    loadProducts();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Header productCount={0} connected={false} />
        <LoadingState message={loadingMessage} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Header productCount={stats.total} connected={supabaseConnected} />
      
      <div className="p-3 bg-emerald-50 border-b text-sm">
        <div className="max-w-6xl mx-auto flex gap-6">
          <span><strong>{stats.withKbMatch}</strong> en KB</span>
          <span><strong>{stats.withSynergies}</strong> con sinergias</span>
        </div>
      </div>

      <nav className="bg-white border-b">
        <div className="max-w-6xl mx-auto flex">
          <button
            onClick={() => setView('productos')}
            className={`px-6 py-3 font-medium border-b-2 ${
              view === 'productos' 
                ? 'border-emerald-600 text-emerald-600' 
                : 'border-transparent text-gray-600'
            }`}
          >
            Productos ({stats.total})
          </button>
          <button
            onClick={() => setView('sinergias')}
            className={`px-6 py-3 font-medium border-b-2 ${
              view === 'sinergias' 
                ? 'border-emerald-600 text-emerald-600' 
                : 'border-transparent text-gray-600'
            }`}
          >
            Sinergias
          </button>
          <button
            onClick={() => setView('stats')}
            className={`px-6 py-3 font-medium border-b-2 ${
              view === 'stats' 
                ? 'border-emerald-600 text-emerald-600' 
                : 'border-transparent text-gray-600'
            }`}
          >
            Estadísticas
          </button>
        </div>
      </nav>
      
      {view === 'productos' && (
        <>
          <SearchBar onSearch={setSearchQuery} />
          <CategoryFilter 
            categories={categories} 
            selected={selectedCategory} 
            onSelect={setSelectedCategory} 
          />
          
          <main className="max-w-6xl mx-auto p-4">
            <div className="mb-4 text-sm text-gray-600">
              {filteredProducts.length} productos
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProducts.map((prod: any) => {
                const ingNames = prod.ingredientes_encontrados?.map((id: string) => kb[id]?.nombre).filter(Boolean) || [];
                const sinCount = prod.sinergias_detectadas?.length || 0;
                return (
                  <div
                    key={prod.sku}
                    className="bg-white border rounded-lg p-4 cursor-pointer hover:border-emerald-500"
                    onClick={() => {
                      const ing = kb[prod.ingredientes_encontrados?.[0]] || { id: prod.sku, nombre: prod.nombre_comercial, descripcion: prod.descripcion, categoria: prod.categoria_principal || 'KB', beneficios: [], mecanismo_accion: '' };
                      setSelectedIngredient(ing as IngredientInfo);
                    }}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-gray-900 line-clamp-1">{prod.nombre_comercial || prod.sku}</h3>
                      {prod.cobertura_kb > 0 && (
                        <span className={`text-xs px-2 py-1 rounded ${prod.cobertura_kb >= 50 ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
                          {prod.cobertura_kb}%
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2 mb-3">{prod.descripcion || 'Sin descripción'}</p>
                    <div className="flex flex-wrap gap-1 mb-2">
                      {ingNames.slice(0, 3).map((name: string, i: number) => (
                        <span key={i} className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded">
                          {name.split(' ')[0]}
                        </span>
                      ))}
                      {ingNames.length > 3 && (
                        <span className="text-xs text-gray-500">+{ingNames.length - 3}</span>
                      )}
                    </div>
                    {sinCount > 0 && (
                      <div className="text-xs text-emerald-600">+{sinCount} sinergia(s)</div>
                    )}
                  </div>
                );
              })}
            </div>
            
            {filteredProducts.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <p className="text-lg">No se encontraron productos</p>
                <p className="text-sm mt-2">Intenta con otros términos de búsqueda</p>
              </div>
            )}
          </main>
        </>
      )}
      
      {view === 'sinergias' && <SynergyFinder />}
      
      {view === 'stats' && (
        <main className="max-w-6xl mx-auto p-4">
          <StatsPanel />
          
          <div className="mt-6 bg-white rounded-lg border p-6">
            <h3 className="text-lg font-semibold mb-4">Estadísticas del Grafo</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-3xl font-bold text-emerald-600">
                  {getIngredientCount()}
                </div>
                <div className="text-sm text-gray-600">Ingredientes</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-3xl font-bold text-emerald-600">
                  {synergyGraphService.obtenerEstadisticas().sinergiasTotales}
                </div>
                <div className="text-sm text-gray-600">Sinergias</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-3xl font-bold text-red-600">
                  {synergyGraphService.obtenerEstadisticas().antagonismosTotales}
                </div>
                <div className="text-sm text-gray-600">Antagonismos</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-3xl font-bold text-blue-600">
                  {categories.length}
                </div>
                <div className="text-sm text-gray-600">Categorías</div>
              </div>
            </div>
          </div>
        </main>
      )}
      
      {selectedIngredient && (
        <IngredientDetail 
          ingredient={selectedIngredient} 
          onClose={() => setSelectedIngredient(null)} 
        />
      )}
    </div>
  );
}
