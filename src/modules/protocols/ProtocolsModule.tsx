/**
 * ProtocolsModule - Módulo de Protocolos de Suplementación
 */

import React, { useState, useEffect } from 'react';
import { Search, Loader2, Filter } from 'lucide-react';
import { ProtocolCard, ProtocolDetail } from './components';
import { supabaseSyncService } from '../../services/SupabaseSyncService';
import type { Protocol } from '../../core/types/schema.types';
import { clsx } from 'clsx';

const categories = [
  { id: 'all', label: 'Todos', emoji: '✨' },
  { id: 'inmunidad', label: 'Inmunidad', emoji: '🛡️' },
  { id: 'sueño', label: 'Sueño', emoji: '😴' },
  { id: 'articulaciones', label: 'Articulaciones', emoji: '🦴' },
  { id: 'estres', label: 'Estrés', emoji: '🧘' },
  { id: 'energia', label: 'Energía', emoji: '⚡' },
];

const difficulties = [
  { id: 'all', label: 'Todas' },
  { id: 'baja', label: '🟢 Fácil' },
  { id: 'intermedia', label: '🟡 Medio' },
  { id: 'alta', label: '🔴 Avanzado' },
];

export const ProtocolsModule: React.FC = () => {
  const [protocols, setProtocols] = useState<Protocol[]>([]);
  const [filteredProtocols, setFilteredProtocols] = useState<Protocol[]>([]);
  const [selectedProtocol, setSelectedProtocol] = useState<Protocol | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');

  useEffect(() => {
    loadProtocols();
  }, []);

  useEffect(() => {
    filterProtocols();
  }, [protocols, searchQuery, selectedCategory, selectedDifficulty]);

  const loadProtocols = async () => {
    setIsLoading(true);
    try {
      const data = await supabaseSyncService.fetchProtocols();
      if (data.length > 0) {
        setProtocols(data);
      } else {
        setProtocols(getSampleProtocols());
      }
    } catch {
      setProtocols(getSampleProtocols());
    } finally {
      setIsLoading(false);
    }
  };

  const filterProtocols = () => {
    let filtered = [...protocols];
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(query) ||
        p.description?.toLowerCase().includes(query) ||
        p.objetivo_principal?.toLowerCase().includes(query)
      );
    }
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(p => p.category === selectedCategory);
    }
    if (selectedDifficulty !== 'all') {
      filtered = filtered.filter(p => p.dificultad === selectedDifficulty);
    }
    setFilteredProtocols(filtered);
  };

  const handleStartProtocol = (protocol: Protocol) => {
    logger.info(('Iniciar protocolo:', protocol);
    setSelectedProtocol(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-violet-500 mx-auto mb-3" />
          <p className="text-slate-500">Cargando protocolos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-4xl">📋</span>
          <h1 className="text-3xl font-bold text-slate-800">Protocolos de Suplementación</h1>
        </div>
        <p className="text-slate-600">Planes personalizados para diferentes objetivos de salud</p>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar protocolos..."
            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-500/20 transition-all"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-4 mb-8">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-medium text-slate-500 mb-2">Categoría</label>
          <div className="flex flex-wrap gap-2">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={clsx(
                  'px-3 py-1.5 rounded-full text-sm font-medium transition-all',
                  selectedCategory === cat.id
                    ? 'bg-violet-500 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                )}
              >
                {cat.emoji} {cat.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-500 mb-2">Dificultad</label>
          <select
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
            className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-violet-500"
          >
            {difficulties.map(diff => (
              <option key={diff.id} value={diff.id}>{diff.label}</option>
            ))}
          </select>
        </div>
      </div>

      <p className="text-sm text-slate-500 mb-4">
        Mostrando {filteredProtocols.length} de {protocols.length} protocolos
      </p>

      {filteredProtocols.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProtocols.map(protocol => (
            <ProtocolCard
              key={protocol.id}
              protocol={protocol}
              onClick={setSelectedProtocol}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-slate-50 rounded-2xl">
          <span className="text-4xl mb-3 block">🔍</span>
          <p className="text-slate-600">No se encontraron protocolos</p>
        </div>
      )}

      {selectedProtocol && (
        <ProtocolDetail
          protocol={selectedProtocol}
          onClose={() => setSelectedProtocol(null)}
          onStartProtocol={handleStartProtocol}
        />
      )}
    </div>
  );
};

const getSampleProtocols = (): Protocol[] => [
  {
    id: 'sample-1',
    name: 'Refuerzo Inmunológico',
    description: 'Protocolo para fortalecer el sistema inmune durante épocas de frío o estrés.',
    category: 'inmunidad',
    objetivo_principal: 'Fortalecer el sistema inmunológico',
    duracion_dias: 30,
    dificultad: 'baja',
    evidencia_level: 'B',
    ingredients: [
      { nombre: 'Vitamina C', dosis: '1000mg', momento: 'mañana' },
      { nombre: 'Zinc', dosis: '30mg', momento: 'almuerzo' },
      { nombre: 'Equinácea', dosis: '500mg', momento: 'tarde' },
    ],
    contraindicaciones: ['Alergia a algún componente', 'Enfermedades autoinmunes'],
    is_active: true,
    is_featured: true,
    is_verified: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    version: 1,
  },
  {
    id: 'sample-2',
    name: 'Mejora del Sueño',
    description: 'Protocolo natural para mejorar la calidad del sueño sin efectos secundarios.',
    category: 'sueño',
    objetivo_principal: 'Mejorar la calidad del sueño',
    duracion_dias: 45,
    dificultad: 'baja',
    evidencia_level: 'B',
    ingredients: [
      { nombre: 'Melatonina', dosis: '3mg', momento: '30min antes de dormir' },
      { nombre: 'Valeriana', dosis: '500mg', momento: '30min antes de dormir' },
      { nombre: 'Magnesio', dosis: '400mg', momento: 'cena' },
    ],
    contraindicaciones: ['Embarazo', 'Lactancia'],
    is_active: true,
    is_featured: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    version: 1,
  },
  {
    id: 'sample-3',
    name: 'Salud Articular',
    description: 'Protocolo para mantener articulaciones sanas y reducir inflamación.',
    category: 'articulaciones',
    objetivo_principal: 'Reducir inflamación articular',
    duracion_dias: 90,
    dificultad: 'intermedia',
    evidencia_level: 'B',
    ingredients: [
      { nombre: 'Colágeno', dosis: '10g', momento: 'mañana en ayunas' },
      { nombre: 'Glucosamina', dosis: '1500mg', momento: 'almuerzo' },
      { nombre: 'Omega-3', dosis: '2000mg', momento: 'cena' },
    ],
    contraindicaciones: ['Alergia al marisco', 'Anticoagulantes'],
    is_active: true,
    is_featured: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    version: 1,
  },
  {
    id: 'sample-4',
    name: 'Manejo del Estrés',
    description: 'Protocolo adaptogénico para manejar el estrés crónico.',
    category: 'estres',
    objetivo_principal: 'Reducir niveles de cortisol',
    duracion_dias: 60,
    dificultad: 'intermedia',
    evidencia_level: 'B',
    ingredients: [
      { nombre: 'Ashwagandha', dosis: '600mg', momento: 'mañana' },
      { nombre: 'Magnesio', dosis: '400mg', momento: 'tarde' },
      { nombre: 'Vitamina B Complex', dosis: '1 cápsula', momento: 'desayuno' },
    ],
    contraindicaciones: ['Embarazo', 'Lactancia', 'Tiroides'],
    is_active: true,
    is_featured: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    version: 1,
  },
  {
    id: 'sample-5',
    name: 'Energía y Vitalidad',
    description: 'Protocolo para combatir la fatiga y mejorar niveles de energía.',
    category: 'energia',
    objetivo_principal: 'Aumentar energía',
    duracion_dias: 30,
    dificultad: 'baja',
    evidencia_level: 'B',
    ingredients: [
      { nombre: 'Vitamina B12', dosis: '1000mcg', momento: 'mañana sublingual' },
      { nombre: 'Hierro', dosis: '18mg', momento: 'almuerzo' },
      { nombre: 'CoQ10', dosis: '100mg', momento: 'desayuno' },
    ],
    contraindicaciones: ['Hemocromatosis', 'Embarazo'],
    is_active: true,
    is_featured: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    version: 1,
  },
];

export default ProtocolsModule;
