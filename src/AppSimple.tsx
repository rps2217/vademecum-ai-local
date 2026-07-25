/**
 * Vademecum AI - Aplicación Simplificada
 * 
 * UI simple, rápida y sin animaciones.
 * Alto rendimiento, práctica y funcional.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { getCombinedKnowledgeBase, getIngredientCount, getStatsByCategory } from './core/knowledge-base';
import { synergyGraphService } from './core/knowledge-base/SynergyGraph';
import type { IngredientInfo } from './core/knowledge-base/ingredients';

// Usar el servicio exportado

// ==================== COMPONENTES SIMPLES ====================

function Header() {
  return (
    <header className="bg-emerald-600 text-white p-4">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <h1 className="text-xl font-bold">Vademecum AI</h1>
        <span className="text-sm opacity-80">Base de {getIngredientCount()} ingredientes</span>
      </div>
    </header>
  );
}

function SearchBar({ onSearch }: { onSearch: (query: string) => void }) {
  const [query, setQuery] = useState('');
  
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
          placeholder="Buscar ingrediente... (ej: vitamina c, zinc, magnesio)"
          className="w-full p-3 border-2 border-gray-300 rounded-lg text-lg focus:border-emerald-500 focus:outline-none"
        />
      </div>
    </form>
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

function StatsPanel() {
  const stats = getStatsByCategory();
  
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
  const [view, setView] = useState<'buscar' | 'sinergias' | 'stats'>('buscar');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('todas');
  const [selectedIngredient, setSelectedIngredient] = useState<IngredientInfo | null>(null);
  
  const kb = getCombinedKnowledgeBase();
  const categories = [...new Set(Object.values(kb).map(i => i.categoria))].sort();
  
  // Filtrar ingredientes
  const filteredIngredients = Object.values(kb).filter(ing => {
    const matchesCategory = selectedCategory === 'todas' || ing.categoria === selectedCategory;
    const matchesSearch = !searchQuery || 
      ing.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ing.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ing.descripcion.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });
  
  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      
      {/* Navegación simple */}
      <nav className="bg-white border-b">
        <div className="max-w-6xl mx-auto flex">
          <button
            onClick={() => setView('buscar')}
            className={`px-6 py-3 font-medium border-b-2 ${
              view === 'buscar' 
                ? 'border-emerald-600 text-emerald-600' 
                : 'border-transparent text-gray-600'
            }`}
          >
            Buscar
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
      
      {view === 'buscar' && (
        <>
          <SearchBar onSearch={setSearchQuery} />
          <CategoryFilter 
            categories={categories} 
            selected={selectedCategory} 
            onSelect={setSelectedCategory} 
          />
          
          <main className="max-w-6xl mx-auto p-4">
            <div className="mb-4 text-sm text-gray-600">
              {filteredIngredients.length} ingredientes encontrados
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredIngredients.map(ing => (
                <IngredientCard
                  key={ing.id}
                  ingredient={ing}
                  onClick={() => setSelectedIngredient(ing)}
                />
              ))}
            </div>
            
            {filteredIngredients.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <p className="text-lg">No se encontraron ingredientes</p>
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
