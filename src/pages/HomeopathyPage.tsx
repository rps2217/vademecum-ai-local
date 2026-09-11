/**
 * HomeopathyPage - Dashboard Clínico de Homeopatía y Materia Médica
 *
 * Módulo especializado para consultoras y farmacéuticos:
 * - Repertorio dinámico por síntomas clave y modalidades (Empeora / Mejora)
 * - Fórmulas y protocolos clínicos de mostrador con 1-clic a la bandeja
 * - Guía interactiva de potencias y diluciones centesimales (CH)
 * - Decálogo de dispensación, seguridad y absorción sublingual
 */

import { useState } from 'react';
import { useHomeopathyData } from '@/hooks/useHomeopathyData';
import { DilutionGuideCard } from '@/components/homeopathy/DilutionGuideCard';
import { HomeopathyProtocols } from '@/components/homeopathy/HomeopathyProtocols';
import { HomeopathyRepertory } from '@/components/homeopathy/HomeopathyRepertory';
import { DispensationSafetyGuide } from '@/components/homeopathy/DispensationSafetyGuide';
import { IngredientDetail } from '@/ui/IngredientDetail';
import { useFavorites } from '@/hooks/useFavorites';
import { db } from '@/db';
import type { DbIngredient } from '@/db/schema';
import type { HomeopathicRemedyData } from '@/types/homeopathy';
import {
  FlaskConical,
  ClipboardList,
  Sparkles,
  BookOpen,
  ShieldCheck,
  Compass,
  Layers,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card } from '@/ui/Card';

type DashboardTab = 'repertory' | 'protocols' | 'dilutions' | 'safety';

export function HomeopathyPage() {
  const [activeTab, setActiveTab] = useState<DashboardTab>('repertory');
  const [query, setQuery] = useState('');
  const [system, setSystem] = useState('');
  const [indication, setIndication] = useState('');
  const [worseWith, setWorseWith] = useState('');
  const [betterWith, setBetterWith] = useState('');

  // Hook de datos homeopáticos
  const { filteredRemedies, stats, total, remedies } = useHomeopathyData({
    query,
    system,
    indication,
    worseWith,
    betterWith,
  });

  // Modal de detalle de ingrediente
  const [selectedIngredient, setSelectedIngredient] = useState<DbIngredient | null>(null);
  const { isFavorite, toggleFavorite } = useFavorites();

  const handleOpenDetail = async (remedy: HomeopathicRemedyData) => {
    // Cargar el ingrediente desde Dexie para compatibilidad total con IngredientDetail
    const dbItem = await db.ingredients.get(remedy.id);
    if (dbItem) {
      setSelectedIngredient(dbItem);
    } else {
      // Fallback
      setSelectedIngredient({
        id: remedy.id,
        nombre: remedy.nombre,
        sinonimos: remedy.nombresAlternativos || [],
        categoria: 'homeopatia',
        familia: remedy.familia,
        sistemas: remedy.sistemas,
        indicaciones: remedy.indicaciones,
        evidencia: remedy.nivelEvidencia,
        propiedades: [remedy.descripcion, remedy.mecanismoAccion || ''].filter(Boolean),
        posologia: remedy.dilucionesCH ? `Diluciones CH: ${remedy.dilucionesCH.join(', ')}` : undefined,
        seguridad: remedy.seguridad || {
          embarazo: 'apto',
          lactancia: 'apto',
          pediatria: 'apto',
          hipertension: 'apto',
          diabetes: 'apto',
          celiacos: 'apto',
        },
        interacciones: remedy.interaccionesMedicamentosas || [],
        fuentes: ['Materia Médica Homeopática Boiron/Hahnemann'],
        lamport: 0,
        deviceId: 'local',
        updatedAt: Date.now(),
        createdAt: Date.now(),
        tombstone: 0,
      });
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header del Dashboard */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <FlaskConical className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold font-heading text-foreground">
                Dashboard de Homeopatía y Materia Médica
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Repertorio clínico, potencias CH, fórmulas de mostrador y dispensación segura
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tarjetas de Métricas Rápidas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="p-3.5 sm:p-4 border-border/70 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs text-muted-foreground font-medium block">Materia Médica</span>
            <span className="text-lg font-bold text-foreground">{total} remedios</span>
          </div>
        </Card>

        <Card className="p-3.5 sm:p-4 border-border/70 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
            <ClipboardList className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs text-muted-foreground font-medium block">Protocolos de Mostrador</span>
            <span className="text-lg font-bold text-foreground">8 fórmulas</span>
          </div>
        </Card>

        <Card className="p-3.5 sm:p-4 border-border/70 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs text-muted-foreground font-medium block">Sistemas Clínicos</span>
            <span className="text-lg font-bold text-foreground">{stats.systemsCount} ejes</span>
          </div>
        </Card>

        <Card className="p-3.5 sm:p-4 border-border/70 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs text-muted-foreground font-medium block">Potencias CH</span>
            <span className="text-lg font-bold text-foreground">4 CH a 30 CH</span>
          </div>
        </Card>
      </div>

      {/* Tabs de Navegación del Dashboard */}
      <div className="flex items-center gap-2 border-b border-border/70 pb-2 overflow-x-auto scrollbar-thin">
        <button
          onClick={() => setActiveTab('repertory')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap',
            activeTab === 'repertory'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          )}
        >
          <BookOpen className="w-4 h-4" />
          Repertorio y Materia Médica ({filteredRemedies.length})
        </button>

        <button
          onClick={() => setActiveTab('protocols')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap',
            activeTab === 'protocols'
              ? 'bg-purple-600 text-white shadow-sm'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          )}
        >
          <ClipboardList className="w-4 h-4" />
          Protocolos Clínicos de Mostrador
        </button>

        <button
          onClick={() => setActiveTab('dilutions')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap',
            activeTab === 'dilutions'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          )}
        >
          <Compass className="w-4 h-4" />
          Guía de Diluciones CH
        </button>

        <button
          onClick={() => setActiveTab('safety')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap',
            activeTab === 'safety'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          )}
        >
          <ShieldCheck className="w-4 h-4" />
          Dispensación y Seguridad
        </button>
      </div>

      {/* Contenido según la pestaña activa */}
      <div className="mt-4">
        {activeTab === 'repertory' && (
          <div className="space-y-6">
            <HomeopathyRepertory
              remedies={remedies}
              filteredRemedies={filteredRemedies}
              stats={stats}
              query={query}
              setQuery={setQuery}
              system={system}
              setSystem={setSystem}
              indication={indication}
              setIndication={setIndication}
              worseWith={worseWith}
              setWorseWith={setWorseWith}
              betterWith={betterWith}
              setBetterWith={setBetterWith}
              onOpenDetail={handleOpenDetail}
            />
          </div>
        )}

        {activeTab === 'protocols' && (
          <div className="space-y-6">
            <HomeopathyProtocols
              onSelectRemedy={async (id) => {
                const remedy = await db.ingredients.get(id);
                if (remedy) setSelectedIngredient(remedy);
              }}
            />
          </div>
        )}

        {activeTab === 'dilutions' && (
          <div className="space-y-6">
            <DilutionGuideCard />
          </div>
        )}

        {activeTab === 'safety' && (
          <div className="space-y-6">
            <DispensationSafetyGuide />
          </div>
        )}
      </div>

      {/* Modal de Detalle de Remedio */}
      {selectedIngredient && (
        <IngredientDetail
          ingredient={selectedIngredient}
          onClose={() => setSelectedIngredient(null)}
          isFavorite={isFavorite(selectedIngredient.id)}
          onToggleFavorite={toggleFavorite}
        />
      )}
    </div>
  );
}
