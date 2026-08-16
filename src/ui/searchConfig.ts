/**
 * Configuración visual compartida para búsqueda y resultados.
 *
 * Centraliza los mapas de categorías, evidencia e iconos de indicación
 * que antes estaban duplicados en SearchPage, KnowledgePage, ConditionCard
 * e IngredientDetail.
 */

import {
  Leaf, FlaskConical, Pill, Brain, HeartPulse, Wind, Moon, Zap, Utensils,
  Shield, Sparkles, Bone, Eye, Droplet, Activity, Flame, ShieldCheck, Baby,
  Dna,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { normalize } from '@/lib/text';
import { BODY_SYSTEMS, type BodySystem } from '@/types/shared-enums';

export const CATEGORIES: { value: string; label: string }[] = [
  { value: '', label: 'Todas' },
  { value: 'fitoterapia', label: 'Fitoterapia' },
  { value: 'homeopatia', label: 'Homeopatía' },
  { value: 'aceite_esencial', label: 'Aceites' },
  { value: 'vitamina', label: 'Vitaminas' },
  { value: 'mineral', label: 'Minerales' },
  { value: 'aminoacido', label: 'Aminoácidos' },
  { value: 'probiotico', label: 'Probióticos' },
];

export interface CategoryConfig {
  icon: LucideIcon;
  color: string;
}

export const CATEGORY_CONFIG: Record<string, CategoryConfig> = {
  fitoterapia: { icon: Leaf, color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' },
  homeopatia: { icon: FlaskConical, color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400' },
  aceite_esencial: { icon: FlaskConical, color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400' },
  vitamina: { icon: Pill, color: 'bg-violet-500/10 text-violet-600 dark:text-violet-400' },
  mineral: { icon: Pill, color: 'bg-slate-500/10 text-slate-600 dark:text-slate-400' },
  aminoacido: { icon: Pill, color: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400' },
  probiotico: { icon: Leaf, color: 'bg-pink-500/10 text-pink-600 dark:text-pink-400' },
};

export const DEFAULT_CATEGORY_CONFIG: CategoryConfig = {
  icon: Leaf,
  color: 'bg-gray-500/10 text-gray-600 dark:text-gray-400',
};

export function getCategoryConfig(cat: string): CategoryConfig {
  return CATEGORY_CONFIG[cat] ?? DEFAULT_CATEGORY_CONFIG;
}

export interface EvidenceConfig {
  label: string;
  color: string;
  title: string;
}

export const EVIDENCE_CONFIG: Record<string, EvidenceConfig> = {
  A: { label: 'A', color: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-500/30 font-semibold', title: 'Evidencia alta: meta-análisis / ensayos clínicos' },
  B: { label: 'B', color: 'bg-sky-500/15 text-sky-700 dark:text-sky-300 ring-1 ring-sky-500/30 font-semibold', title: 'Evidencia media: estudios controlados' },
  C: { label: 'C', color: 'bg-gray-500/10 text-gray-600 dark:text-gray-400 ring-1 ring-gray-500/20', title: 'Evidencia baja: estudios observacionales' },
  D: { label: 'D', color: 'bg-gray-500/10 text-gray-600 dark:text-gray-400 ring-1 ring-gray-500/20', title: 'Evidencia muy baja: uso tradicional' },
};

export const DEFAULT_EVIDENCE_CONFIG: EvidenceConfig = EVIDENCE_CONFIG.C;

export function getEvidenceConfig(ev: string): EvidenceConfig {
  return EVIDENCE_CONFIG[ev] ?? DEFAULT_EVIDENCE_CONFIG;
}

export const EVIDENCE_RANK: Record<string, number> = { A: 0, B: 1, C: 2, D: 3 };

export const EVIDENCE_LEVELS = ['A', 'B', 'C', 'D'] as const;
export type EvidenceLevel = typeof EVIDENCE_LEVELS[number];

export const RESULTS_PAGE_SIZE = 12;
export const CHIPS_COLLAPSED_COUNT = 6;

/** Configuración visual de los sistemas corporales (orden = BODY_SYSTEMS). */
export const BODY_SYSTEM_CONFIG: Record<BodySystem, { label: string; icon: LucideIcon }> = {
  nervioso: { label: 'Nervioso', icon: Brain },
  digestivo: { label: 'Digestivo', icon: Utensils },
  inmune: { label: 'Inmune', icon: Shield },
  cardiovascular: { label: 'Cardiovascular', icon: HeartPulse },
  respiratorio: { label: 'Respiratorio', icon: Wind },
  musculoesqueletico: { label: 'Musculoesquelético', icon: Bone },
  endocrino: { label: 'Endocrino', icon: Dna },
  dermatologico: { label: 'Dermatológico', icon: ShieldCheck },
  urinario: { label: 'Urinario', icon: Droplet },
  reproductivo: { label: 'Reproductivo', icon: Baby },
  ocular: { label: 'Ocular', icon: Eye },
  hepatico: { label: 'Hepático', icon: Droplet },
  metabolico: { label: 'Metabólico', icon: Activity },
};

export const BODY_SYSTEM_CHIPS: { value: BodySystem; label: string; icon: LucideIcon }[] =
  BODY_SYSTEMS.map(s => ({ value: s, label: BODY_SYSTEM_CONFIG[s].label, icon: BODY_SYSTEM_CONFIG[s].icon }));

const INDICATION_ICONS: Record<string, LucideIcon> = {
  ansiedad: Brain,
  insomnio: Moon,
  estres: Brain,
  cognitivo: Brain,
  depresion: Brain,
  fatiga: Zap,
  energia: Zap,
  energetico: Zap,
  inmunidad: Shield,
  antioxidante: Sparkles,
  tos: Wind,
  respiratorio: Wind,
  bronquitis: Wind,
  gripe: Wind,
  alergias: Wind,
  cardiovascular: HeartPulse,
  colesterol: HeartPulse,
  hipertension: HeartPulse,
  circulacion: HeartPulse,
  coagulacion: HeartPulse,
  glucosa: Activity,
  metabolico: Activity,
  digestion: Utensils,
  digestivo: Utensils,
  dispepsia: Utensils,
  intestinal: Utensils,
  diarrea: Droplet,
  urinario: Droplet,
  hepatico: Droplet,
  piel: ShieldCheck,
  dermatologico: ShieldCheck,
  cicatrizacion: ShieldCheck,
  articular: Bone,
  muscular: Bone,
  inflamacion: Flame,
  ocular: Eye,
  fertilidad: Baby,
  menstrual: Baby,
  menopausia: Baby,
  hormonal: Baby,
};

export function indicationIcon(value: string): LucideIcon {
  return INDICATION_ICONS[normalize(value)] ?? Activity;
}
