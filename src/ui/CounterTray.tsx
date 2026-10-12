/**
 * CounterTray - Bandeja de Orientación de Mostrador en Tiempo Real.
 *
 * Permite al farmacéutico validar combinaciones de suplementos frente al cliente
 * en 1 mirada sin tener que teclear ni salir de la pantalla de búsqueda,
 * con verificación en vivo de compatibilidad con medicamentos habituales (Sintrom, Estatinas, etc.).
 */

import { useState } from 'react';
import { useCounterTray } from '@/contexts/CounterTrayContext';
import { useClientProfile, CLIENT_PROFILES } from '@/contexts/ClientProfileContext';
import {
  Sparkles, AlertTriangle, CheckCircle2, X, ChevronUp, ChevronDown,
  Copy, Trash2, ArrowRight, Check, Pill, ShieldAlert
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { humanize } from '@/lib/text';
import { toast } from 'sonner';
import { getCategoryConfig } from '@/ui/searchConfig';

const QUICK_MEDICATION_CHIPS = ['Sintrom', 'Atorvastatina', 'Prozac', 'Enalapril', 'Metformina', 'Eutirox'];

export function CounterTray() {
  const {
    items,
    removeItem,
    clearTray,
    isOpen,
    setIsOpen,
    synergies,
    antagonisms,
    safetyEvaluations,
    totalCount,
    patientMedication,
    setPatientMedication,
    detectedDrugInteractions,
  } = useCounterTray();

  const { profile } = useClientProfile();
  const [copied, setCopied] = useState(false);

  const activeProfileObj = CLIENT_PROFILES.find((p) => p.value === profile);

  if (totalCount === 0) {
    return null;
  }

  const copyPrescription = () => {
    if (items.length === 0) return;

    const lines: string[] = [];
    lines.push('📋 PAUTA DE SUPLEMENTACIÓN / ORIENTACIÓN:');
    if (activeProfileObj && activeProfileObj.value !== 'ninguno') {
      lines.push(`👤 Perfil del consultante: ${activeProfileObj.label}`);
    }
    if (patientMedication) {
      lines.push(`💊 Medicación crónica declarada: ${patientMedication}`);
    }
    lines.push('');
    lines.push('🌿 Ingredientes recomendados:');
    items.forEach((item, idx) => {
      lines.push(`${idx + 1}. ${item.nombre} (${humanize(item.categoria)})`);
      if (item.posologia) {
        lines.push(`   ▸ Posología: ${item.posologia}`);
      }
      if (item.indicaciones?.length) {
        lines.push(`   ▸ Para: ${item.indicaciones.slice(0, 2).map(humanize).join(', ')}`);
      }
    });

    if (synergies.length > 0) {
      lines.push('');
      lines.push('🤝 Sinergias detectadas:');
      synergies.forEach((s) => {
        lines.push(` • ${s.ingredientA.nombre} + ${s.ingredientB.nombre}: ${s.synergy.mecanismo || s.synergy.descripcion || 'Potenciación mutua'}`);
      });
    }

    if (detectedDrugInteractions.length > 0) {
      lines.push('');
      lines.push('🚨 Alerta Fármaco-Nutriente con Medicación habitual:');
      detectedDrugInteractions.forEach((d) => {
        lines.push(` • ${d.interaction.drugClass} ↔ ${d.matchedIngredient.nombre}: ${d.interaction.effectTitle}. ${d.interaction.counterAdvice}`);
      });
    }

    if (antagonisms.length > 0) {
      lines.push('');
      lines.push('⚠️ Advertencias / Precauciones entre activos:');
      antagonisms.forEach((a) => {
        lines.push(` • ${a.ingredientA.nombre} con ${a.ingredientB.nombre}: ${a.synergy.descripcion || 'Posible interacción antagónica'}`);
      });
    }

    lines.push('');
    lines.push('ℹ️ Recuerde consultar a su farmacéutico o médico en caso de duda o si está tomando otra medicación.');

    navigator.clipboard.writeText(lines.join('\n'));
    setCopied(true);
    toast.success('Pauta de orientación copiada al portapapeles');
    setTimeout(() => setCopied(false), 2500);
  };

  const hasDrugWarning = detectedDrugInteractions.length > 0;
  const hasAntagonism = antagonisms.length > 0;
  const hasSynergy = synergies.length > 0;

  return (
    <aside
      aria-label="Bandeja de orientación de mostrador"
      className={cn(
        'fixed bottom-0 inset-x-0 z-40 max-w-5xl mx-auto px-3 sm:px-6 transition-all duration-300 pointer-events-none'
      )}
    >
      <div className="bg-card/98 dark:bg-card/95 backdrop-blur-md border-t-2 sm:border-2 border-primary/30 rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden pointer-events-auto transition-all">
        {/* Barra superior de control */}
        <div className="px-4 py-2.5 bg-muted/60 flex items-center justify-between gap-3 border-b border-border/60 select-none">
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg py-0.5"
          >
            <span className="font-heading font-bold text-sm text-foreground flex items-center gap-1.5">
              <span>Bandeja de Mostrador</span>
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                {totalCount}
              </span>
            </span>

            {/* Badges de estado rápido */}
            {hasDrugWarning ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-600 text-white animate-pulse">
                <ShieldAlert className="w-3 h-3" />
                Alerta Fármaco-Nutriente
              </span>
            ) : hasAntagonism ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-500/15 text-red-700 dark:text-red-300 ring-1 ring-red-500/30">
                <AlertTriangle className="w-3 h-3" />
                Interacción
              </span>
            ) : hasSynergy ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-500/30">
                <Sparkles className="w-3 h-3" />
                Sinergia (+{synergies.length})
              </span>
            ) : (
              <span className="text-xs text-muted-foreground hidden sm:inline">
                {totalCount === 1 ? 'Añade otro para comparar' : 'Sin interacciones directas'}
              </span>
            )}
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={copyPrescription}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-primary/10 hover:bg-primary/20 text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              title="Copiar pauta para el cliente"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{copied ? 'Copiado' : 'Copiar pauta'}</span>
            </button>

            <button
              type="button"
              onClick={clearTray}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              title="Vaciar bandeja"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Vaciar</span>
            </button>

            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label={isOpen ? 'Minimizar bandeja' : 'Expandir bandeja'}
            >
              {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Panel expandible */}
        {isOpen && (
          <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
            {/* Verificador de medicación de prescripción */}
            <div className="p-3 rounded-xl bg-card border border-border/80 space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label htmlFor="patient-medication-input" className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Pill className="w-3.5 h-3.5 text-primary" />
                  <span>Comprobar medicación habitual del cliente (receta):</span>
                </label>
                <div className="flex items-center gap-1 overflow-x-auto text-[11px]">
                  {QUICK_MEDICATION_CHIPS.map((med) => (
                    <button
                      key={med}
                      type="button"
                      onClick={() => setPatientMedication(patientMedication === med ? '' : med)}
                      className={cn(
                        'px-2 py-0.5 rounded-md border transition-colors whitespace-nowrap',
                        patientMedication.toLowerCase() === med.toLowerCase()
                          ? 'bg-primary text-primary-foreground border-primary font-bold'
                          : 'bg-muted/50 border-border/60 text-muted-foreground hover:text-foreground'
                      )}
                    >
                      {med}
                    </button>
                  ))}
                </div>
              </div>

              <div className="relative">
                <input
                  id="patient-medication-input"
                  type="text"
                  placeholder="Ej: Sintrom, Atorvastatina, Prozac, Enalapril, Metformina, Eutirox..."
                  value={patientMedication}
                  onChange={(e) => setPatientMedication(e.target.value)}
                  className="w-full h-8 px-3 text-xs bg-muted/40 border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
                {patientMedication && (
                  <button
                    type="button"
                    onClick={() => setPatientMedication('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>

            {/* Alerta de interacción con Medicación */}
            {detectedDrugInteractions.length > 0 && (
              <div className="rounded-xl bg-red-600 text-white p-3 space-y-2 shadow-md">
                <div className="flex items-center gap-1.5 font-bold text-xs">
                  <ShieldAlert className="w-4 h-4 text-white" />
                  <span>ALERTA DE SEGURIDAD: Fármaco de prescripción ↔ Suplemento ({detectedDrugInteractions.length})</span>
                </div>
                <div className="space-y-1.5">
                  {detectedDrugInteractions.map((d, idx) => (
                    <div key={idx} className="bg-red-700/80 rounded-lg p-2 text-xs border border-red-500/50">
                      <div className="font-semibold flex items-center justify-between">
                        <span>{d.matchedIngredient.nombre} con {d.interaction.drugClass}</span>
                        <span className="uppercase text-[9px] px-1.5 py-0.2 bg-red-900 rounded font-bold">
                          {d.interaction.severity}
                        </span>
                      </div>
                      <p className="mt-1 text-red-100 text-[11px] leading-snug">
                        <strong>Efecto:</strong> {d.interaction.clinicalDescription}
                      </p>
                      <p className="mt-1 text-yellow-200 text-[11px] font-medium leading-snug">
                        <strong>Consejo en mostrador:</strong> {d.interaction.counterAdvice}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Lista de ingredientes seleccionados */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              {safetyEvaluations.map(({ ingredient, verdict }) => {
                const catCfg = getCategoryConfig(ingredient.categoria);
                const CatIcon = catCfg.icon;

                return (
                  <div
                    key={ingredient.id}
                    className={cn(
                      'p-3 rounded-xl border bg-background/80 relative flex flex-col justify-between gap-2 shadow-xs group',
                      verdict === 'contraindicado' && 'border-red-500/50 bg-red-500/5',
                      verdict === 'precaucion' && 'border-amber-500/50 bg-amber-500/5',
                      !verdict && 'border-border'
                    )}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-1 mb-1">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <div className={cn('p-1 rounded-md shrink-0', catCfg.color)}>
                            <CatIcon className="w-3 h-3" />
                          </div>
                          <h4 className="font-heading font-semibold text-xs text-foreground truncate">
                            {ingredient.nombre}
                          </h4>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeItem(ingredient.id)}
                          className="p-1 text-muted-foreground hover:text-red-500 rounded-md hover:bg-muted transition-colors"
                          title="Quitar de la bandeja"
                          aria-label={`Quitar ${ingredient.nombre}`}
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Posología rápida */}
                      {ingredient.posologia && (
                        <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5 leading-tight">
                          💊 {ingredient.posologia}
                        </p>
                      )}
                    </div>

                    {/* Alerta de seguridad para el perfil */}
                    <div className="flex items-center justify-between pt-1 border-t border-border/40 text-[10px]">
                      <span className="text-muted-foreground capitalize truncate">
                        {ingredient.categoria.replace('_', ' ')}
                      </span>
                      {verdict === 'contraindicado' ? (
                        <span className="font-bold text-red-600 dark:text-red-400">
                          🚫 No recomendado
                        </span>
                      ) : verdict === 'precaucion' ? (
                        <span className="font-medium text-amber-600 dark:text-amber-400">
                          ⚠️ Precaución
                        </span>
                      ) : (
                        <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-0.5">
                          <CheckCircle2 className="w-2.5 h-2.5" /> Apto
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Sinergias detectadas */}
            {synergies.length > 0 && (
              <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/25 p-3 space-y-2">
                <div className="flex items-center gap-1.5 text-emerald-800 dark:text-emerald-300 font-semibold text-xs">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <span>Sinergias Clínicas Confirmadas ({synergies.length})</span>
                </div>
                <div className="space-y-1.5">
                  {synergies.map((s, idx) => (
                    <div key={idx} className="text-xs text-foreground/90 bg-card/70 rounded-lg p-2 border border-emerald-500/20">
                      <div className="font-medium text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                        <span>{s.ingredientA.nombre}</span>
                        <ArrowRight className="w-3 h-3 text-muted-foreground inline" />
                        <span>{s.ingredientB.nombre}</span>
                        <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 ml-auto">
                          {s.synergy.tipo}
                        </span>
                      </div>
                      <p className="text-muted-foreground mt-0.5 text-[11px] leading-snug">
                        {s.synergy.mecanismo || s.synergy.descripcion || 'Potenciación de biodisponibilidad y eficacia terapéutica.'}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Antagonismos / Incompatibilidades detectadas */}
            {antagonisms.length > 0 && (
              <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-3 space-y-2">
                <div className="flex items-center gap-1.5 text-red-800 dark:text-red-300 font-semibold text-xs">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                  <span>Alerta de Interacción / Antagonismo ({antagonisms.length})</span>
                </div>
                <div className="space-y-1.5">
                  {antagonisms.map((a, idx) => (
                    <div key={idx} className="text-xs text-foreground/90 bg-card/70 rounded-lg p-2 border border-red-500/20">
                      <div className="font-medium text-red-700 dark:text-red-400 flex items-center gap-1">
                        <span>{a.ingredientA.nombre}</span>
                        <span className="text-muted-foreground">↔</span>
                        <span>{a.ingredientB.nombre}</span>
                      </div>
                      <p className="text-muted-foreground mt-0.5 text-[11px] leading-snug">
                        {a.synergy.descripcion || 'Se recomienda espaciar la toma de ambos o evitar el uso concomitante.'}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sugerencia de pauta rápida si hay 1 solo ingrediente */}
            {items.length === 1 && (
              <div className="text-center py-2 px-3 rounded-lg bg-muted/40 text-xs text-muted-foreground">
                <p>💡 <strong>Consejo de mostrador:</strong> Puedes añadir otro producto complementario para verificar sinergias o venta cruzada antes de recomendarlo.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
