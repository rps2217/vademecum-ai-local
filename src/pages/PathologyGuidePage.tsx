/**
 * PathologyGuidePage - Guía Clínica de Patologías y Motivos Frecuentes de Mostrador
 *
 * Diseño centrado 100% en el motivo de consulta del cliente ("Vengo a la farmacia por algo para..."):
 * - 32 motivos de consulta frecuentes estructurados en 8 áreas clínicas de mostrador.
 * - Cobertura del 100% de las 146 patologías clínicas de la base de conocimiento local.
 * - Clasificación rápida por área clínica, búsqueda reactiva por síntoma y filtros anatómicos.
 * - Ficha de actuación inmediata: fitoterapia de 1ª línea, suplementación, homeopatía,
 *   señales de alarma (red flags con criterio de derivación médica) y alertas farmacológicas.
 */

import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db';
import type { DbPathology } from '@/db/schema';
import type { BodySystem } from '@/types/shared-enums';
import { BODY_SYSTEM_CHIPS, getEvidenceConfig } from '@/ui/searchConfig';
import { PathologyDetail } from '@/ui/PathologyDetail';
import { Input } from '@/ui/Input';
import { Button } from '@/ui/Button';
import {
  Stethoscope, Search, X, Activity, AlertTriangle,
  HeartPulse, Brain, ShieldAlert, Sparkles, ArrowRight,
  Moon, Zap, Flame, Utensils, Bone, Wind, Eye, Droplet,
  Scale, Smile, CigaretteOff, Heart,
  Shield, AlertCircle, Headphones
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { normalize } from '@/lib/text';

export interface ReasonCategory {
  id: string;
  groupId: 'mente' | 'digestivo' | 'dolor' | 'respiratorio' | 'piel' | 'sentidos' | 'intimo' | 'metabolico';
  title: string;
  subtitle: string;
  patientPhrases: string;
  icon: typeof Brain;
  color: string;
  badgeBg: string;
  pathologyIds: string[];
  keywords: string[];
}

export const REASON_GROUPS = [
  { id: 'todos', label: 'Todos los motivos', icon: Stethoscope },
  { id: 'mente', label: 'Mente, Sueño & Ánimo', icon: Brain },
  { id: 'digestivo', label: 'Digestión & Abdomen', icon: Utensils },
  { id: 'dolor', label: 'Dolor & Articulaciones', icon: Bone },
  { id: 'respiratorio', label: 'Respiratorio & Inmunidad', icon: Wind },
  { id: 'piel', label: 'Piel, Cabello & Uñas', icon: Sparkles },
  { id: 'sentidos', label: 'Ojos, Oídos & Vértigo', icon: Eye },
  { id: 'intimo', label: 'Salud Íntima & Urinaria', icon: Droplet },
  { id: 'metabolico', label: 'Circulación & Metabolismo', icon: HeartPulse },
] as const;

export const COMMON_REASONS: ReasonCategory[] = [
  // 1. Mente, Sueño & Ánimo
  {
    id: 'insomnio_sueno',
    groupId: 'mente',
    title: 'Insomnio y Alteraciones del Sueño',
    subtitle: 'Dificultad de conciliación, despertares nocturnos, jet-lag o piernas inquietas',
    patientPhrases: '"No puedo dormir", "Me despierto a las 3 de la mañana", "Me cuesta conciliar"',
    icon: Moon,
    color: 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800/40',
    badgeBg: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300',
    pathologyIds: ['insomnio', 'ronquido_apnea', 'bruxismo', 'piernas_inquietas'],
    keywords: ['dormir', 'insomnio', 'sueño', 'melatonina', 'despertares', 'apnea', 'ronquidos', 'bruxismo', 'dientes', 'piernas'],
  },
  {
    id: 'estres_ansiedad',
    groupId: 'mente',
    title: 'Estrés, Ansiedad y Estado de Ánimo',
    subtitle: 'Nerviosismo, sobrecarga laboral o emocional, crisis de angustia o desánimo',
    patientPhrases: '"Estoy muy estresado", "Tengo taquicardia por nervios", "Siento opresión y angustia"',
    icon: Brain,
    color: 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800/40',
    badgeBg: 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300',
    pathologyIds: ['estres', 'ansiedad', 'crisis_panico', 'depresion', 'depresion_resistente', 'bipolar'],
    keywords: ['estres', 'ansiedad', 'nervios', 'panico', 'depresion', 'angustia', 'animo', 'tristeza', 'burnout', 'sobrecarga'],
  },
  {
    id: 'fatiga_astenia',
    groupId: 'mente',
    title: 'Cansancio, Astenia y Falta de Energía',
    subtitle: 'Agotamiento físico, astenia primaveral, fatiga persistente o convalecencia',
    patientPhrases: '"No tengo energía para nada", "Me cuesta levantarme", "Cansancio continuo"',
    icon: Zap,
    color: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/40',
    badgeBg: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300',
    pathologyIds: ['fatiga', 'sindrome_fatiga_cronica', 'anemia'],
    keywords: ['fatiga', 'cansancio', 'astenia', 'agotamiento', 'energia', 'anemia', 'hierro', 'debilidad', 'vitalidad'],
  },
  {
    id: 'memoria_cognitivo',
    groupId: 'mente',
    title: 'Memoria, Concentración y Exámenes',
    subtitle: 'Época de estudio intenso, niebla mental, olvidos o declive en adultos mayores',
    patientPhrases: '"Se me olvidan las cosas", "Estoy opositando y no retengo", "Falta de concentración"',
    icon: Sparkles,
    color: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800/40',
    badgeBg: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300',
    pathologyIds: ['declive_cognitivo', 'alzheimer', 'tdah'],
    keywords: ['memoria', 'concentracion', 'estudio', 'examenes', 'olvidos', 'mente', 'atencion', 'tdah', 'alzheimer', 'foco'],
  },
  {
    id: 'cefaleas_migranas',
    groupId: 'mente',
    title: 'Migrañas, Cefaleas y Dolor de Cabeza',
    subtitle: 'Cefalea tensional por contractura, crisis de migraña pulsátil o dolor neurálgico',
    patientPhrases: '"Tengo una punzada en la sien", "Dolor en casco por tensión", "Migraña con náuseas"',
    icon: Flame,
    color: 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/40',
    badgeBg: 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300',
    pathologyIds: ['migraña', 'migrana_cronica', 'cefalea_tensional', 'neuralgia_trigemino'],
    keywords: ['dolor de cabeza', 'cefalea', 'migraña', 'jaqueca', 'sienes', 'tensional', 'trigemino', 'neuralgia'],
  },

  // 2. Digestión & Abdomen
  {
    id: 'ardor_reflujo',
    groupId: 'digestivo',
    title: 'Ardor de Estómago, Acidez y Reflujo',
    subtitle: 'Quemazón retroesternal, regurgitación ácida, gastritis o pesadez tras comer',
    patientPhrases: '"Me quema el pecho", "Tengo fuego en la garganta", "Se me sube la comida"',
    icon: Flame,
    color: 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/40 border-orange-200 dark:border-orange-800/40',
    badgeBg: 'bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300',
    pathologyIds: ['gastritis', 'reflujo', 'ulcera_peptica', 'nauseas_embarazo', 'resaca', 'colecistitis'],
    keywords: ['ardor', 'acidez', 'reflujo', 'gastritis', 'estomago', 'quemazon', 'ulcera', 'nauseas', 'vomitos', 'resaca'],
  },
  {
    id: 'gases_dispepsia',
    groupId: 'digestivo',
    title: 'Gases, Flatulencia e Hinchazón Abdominal',
    subtitle: 'Digestión lenta, vientre hinchado tras las comidas, meteorismo o disbiosis/SIBO',
    patientPhrases: '"Tengo la tripa hinchada", "Muchos gases", "Siento que no digiero la comida"',
    icon: Utensils,
    color: 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-950/40 border-yellow-200 dark:border-yellow-800/40',
    badgeBg: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950/60 dark:text-yellow-300',
    pathologyIds: ['dispepsia', 'gases', 'sii', 'disbiosis', 'colico_lactante', 'intolerancia_lactosa'],
    keywords: ['gases', 'flatulencias', 'hinchazon', 'meteorismo', 'dispepsia', 'pesadez', 'sibo', 'disbiosis', 'colico', 'lactosa'],
  },
  {
    id: 'transito_intestinal',
    groupId: 'digestivo',
    title: 'Estreñimiento, Diarrea y Tránsito Irregular',
    subtitle: 'Tránsito lento y heces duras, diarrea aguda/viajero o inflamación intestinal (EII)',
    patientPhrases: '"Llevo 4 días sin ir al baño", "Tengo diarrea líquida de repente", "Dolor con retortijones"',
    icon: Activity,
    color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/40',
    badgeBg: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300',
    pathologyIds: ['estreñimiento', 'diarrea', 'diverticulosis', 'eii', 'enfermedad_inflamatoria_intestinal', 'parasitos_intestinales'],
    keywords: ['estreñimiento', 'diarrea', 'transito', 'heces', 'laxante', 'suero', 'eii', 'crohn', 'diverticulos', 'parasitos', 'lombrices'],
  },

  // 3. Dolor & Articulaciones
  {
    id: 'dolor_articular',
    groupId: 'dolor',
    title: 'Artrosis, Rigidez y Desgaste Articular',
    subtitle: 'Dolor en rodillas, cadera, dedos o columna, crujidos y rigidez al levantarse',
    patientPhrases: '"Me duelen las rodillas al bajar escaleras", "Tengo las manos agarrotadas", "Artrosis"',
    icon: Bone,
    color: 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/40',
    badgeBg: 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300',
    pathologyIds: ['artrosis', 'artritis_reumatoide', 'artritis_psoriasica'],
    keywords: ['artrosis', 'articulaciones', 'rodilla', 'cadera', 'desgaste', 'rigidez', 'artritis', 'cartilago', 'colageno'],
  },
  {
    id: 'dolor_muscular',
    groupId: 'dolor',
    title: 'Lumbalgia, Ciática y Dolor Muscular',
    subtitle: 'Contracturas de espalda, cuello/cervicales, tirón lumbar o dolor fibroso generalizado',
    patientPhrases: '"Me he quedado clavado de la espalda", "Tirón en los lumbares", "Tortícolis"',
    icon: HeartPulse,
    color: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800/40',
    badgeBg: 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300',
    pathologyIds: ['dolor_muscular', 'lumbalgia', 'dolor_espalda_cervical', 'fibromialgia', 'fibromialgia_dolor', 'fibromialgia_amp', 'calambres_nocturnos'],
    keywords: ['espalda', 'lumbalgia', 'ciatica', 'cuello', 'cervicales', 'contractura', 'musculos', 'fibromialgia', 'calambres'],
  },
  {
    id: 'trauma_lesiones',
    groupId: 'dolor',
    title: 'Traumatología Menor, Esguinces y Tendones',
    subtitle: 'Torceduras de tobillo, codo de tenista, sobrecarga de tendones o fascitis plantar',
    patientPhrases: '"Me he torcido el tobillo", "Me duele la planta del pie al pisar", "Dolor en el codo"',
    icon: Activity,
    color: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/40',
    badgeBg: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300',
    pathologyIds: ['esguince_tendinitis', 'epicondilitis', 'fascitis_plantar', 'tunel_carpiano', 'hombro_congelado'],
    keywords: ['esguince', 'tendinitis', 'tendon', 'tobillo', 'fascitis', 'talon', 'pie', 'codo', 'epicondilitis', 'tunel carpiano', 'hombro'],
  },
  {
    id: 'huesos_gota',
    groupId: 'dolor',
    title: 'Salud Ósea, Osteoporosis y Ácido Úrico / Gota',
    subtitle: 'Prevención de pérdida ósea, fracturas por fragilidad o ataque doloroso de gota en el dedo',
    patientPhrases: '"Tengo densitometría baja", "Ataque agudo de gota con el dedo rojo", "Ácido úrico alto"',
    icon: Bone,
    color: 'text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800/40',
    badgeBg: 'bg-slate-100 text-slate-800 dark:bg-slate-950/60 dark:text-slate-300',
    pathologyIds: ['osteoporosis', 'osteopenia', 'gota', 'sarcopenia'],
    keywords: ['osteoporosis', 'osteopenia', 'huesos', 'gota', 'acido urico', 'densidad osea', 'calcio', 'vitamina d3', 'sarcopenia'],
  },
  {
    id: 'neuropatia_nervios',
    groupId: 'dolor',
    title: 'Dolor Neuropático, Hormigueo y Quemazón',
    subtitle: 'Pinchazos o ardor en pies/manos, neuropatía periférica por diabetes o compresión',
    patientPhrases: '"Siento hormigueo y acorchamiento", "Me queman las plantas de los pies", "Pinchazos"',
    icon: Zap,
    color: 'text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/40 border-violet-200 dark:border-violet-800/40',
    badgeBg: 'bg-violet-100 text-violet-800 dark:bg-violet-950/60 dark:text-violet-300',
    pathologyIds: ['neuropatia_diabetica', 'neuropatia_periferica'],
    keywords: ['neuropatia', 'hormigueo', 'quemazon', 'nervios', 'diabetica', 'adormecimiento', 'pies', 'pinchazos'],
  },

  // 4. Respiratorio & Inmunidad
  {
    id: 'resfriado_gripe',
    groupId: 'respiratorio',
    title: 'Gripe, Resfriado y Estados Febriles',
    subtitle: 'Congestión nasal, destemple, dolor articular por cuadro viral, fiebre o rinitis',
    patientPhrases: '"Tengo destemple y mocos", "Gripe con dolor de cuerpo", "Congestión total"',
    icon: Wind,
    color: 'text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/40 border-cyan-200 dark:border-cyan-800/40',
    badgeBg: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950/60 dark:text-cyan-300',
    pathologyIds: ['gripe', 'fiebre', 'rinitis_alergica'],
    keywords: ['gripe', 'resfriado', 'fiebre', 'destemple', 'congestion', 'mocos', 'rinitis', 'estornudos', 'catarro'],
  },
  {
    id: 'tos_respiratorio',
    groupId: 'respiratorio',
    title: 'Tos Seca, Tos con Flemas y Bronquios',
    subtitle: 'Acceso de tos irritativa de garganta, expectoración espesa, bronquitis o asma/alergia',
    patientPhrases: '"No paro de toser de noche", "Tos de perro con picor", "Tengo el pecho cargado"',
    icon: Wind,
    color: 'text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/40 border-teal-200 dark:border-teal-800/40',
    badgeBg: 'bg-teal-100 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300',
    pathologyIds: ['tos', 'asma_bronquitis', 'asma_alergica', 'epoc'],
    keywords: ['tos', 'tos seca', 'expectoracion', 'flemas', 'pecho', 'bronquitis', 'asma', 'silbidos', 'epoc'],
  },
  {
    id: 'bucal_garganta',
    groupId: 'respiratorio',
    title: 'Garganta, Afonía y Molestias Bucales',
    subtitle: 'Dolor al tragar, garganta irritada, pérdida de voz, aftas/llagas, encías sangrantes o halitosis',
    patientPhrases: '"Me trago cuchillas", "Me he quedado sin voz", "Tengo una llaga dolorosa en el labio"',
    icon: Smile,
    color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/40',
    badgeBg: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300',
    pathologyIds: ['faringitis', 'disfonia', 'afas_bucal', 'gingivitis', 'enfermedad_periodontal', 'halitosis', 'queilitis_angular', 'sindrome_sjogren'],
    keywords: ['garganta', 'faringitis', 'afonía', 'voz', 'llagas', 'aftas', 'encias', 'gingivitis', 'boca', 'boqueras', 'mal aliento'],
  },
  {
    id: 'inmunidad_defensas',
    groupId: 'respiratorio',
    title: 'Defensas Bajas y Reactivaciones Virales',
    subtitle: 'Infecciones repetitivas, herpes labial recurrente (calenturas) o dolor de herpes zóster',
    patientPhrases: '"Empalmo un virus con otro", "Me ha salido una calentura en el labio", "Bajas defensas"',
    icon: Shield,
    color: 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800/40',
    badgeBg: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300',
    pathologyIds: ['inmunidad_baja', 'herpes_labial', 'herpes_zoster', 'cancer_prevencion', 'cancer_mama_prevencion'],
    keywords: ['inmunidad', 'defensas', 'herpes', 'labial', 'calentura', 'zoster', 'culebrilla', 'infecciones', 'sistema inmune'],
  },

  // 5. Piel, Cabello & Uñas
  {
    id: 'dermatitis_eccema',
    groupId: 'piel',
    title: 'Eccemas, Dermatitis Atópica y Piel Reactiva',
    subtitle: 'Piel muy seca con descamación y picor intenso, brotes atópicos, urticaria o dermatitis del pañal',
    patientPhrases: '"Me pica todo el cuerpo", "Brotes de dermatitis en codos", "Piel descamada y roja"',
    icon: Sparkles,
    color: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/40',
    badgeBg: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300',
    pathologyIds: ['eccema', 'dermatitis_atopica', 'dermatitis_contacto', 'dermatitis_pañal', 'xerosis', 'queilitis_solar', 'urticaria'],
    keywords: ['dermatitis', 'eccema', 'atopica', 'picor', 'piel seca', 'urticaria', 'alergia', 'pañal', 'xerosis'],
  },
  {
    id: 'acne_psoriasis',
    groupId: 'piel',
    title: 'Acné, Rosácea y Psoriasis',
    subtitle: 'Granos, espinillas, rojeces faciales y cuperosis o placas descamativas gruesas',
    patientPhrases: '"Tengo la cara llena de granitos inflamados", "Rojeces en mejillas", "Placas blancas"',
    icon: Sparkles,
    color: 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/40',
    badgeBg: 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300',
    pathologyIds: ['acne', 'psoriasis', 'psoriasis_ungueal', 'dermatitis_seborreica', 'rosacea', 'cicatrizacion', 'melasma', 'envejecimiento_cutaneo'],
    keywords: ['acne', 'granos', 'rosacea', 'psoriasis', 'seborreica', 'caspa', 'cicatriz', 'manchas', 'melasma', 'antiarrugas'],
  },
  {
    id: 'cabello_unas',
    groupId: 'piel',
    title: 'Caída de Cabello y Alopecia',
    subtitle: 'Pérdida estacional o androgenética, cabello afinado, falta de densidad capilar',
    patientPhrases: '"Se me cae el pelo a puñados", "Noto menos densidad en la coronilla"',
    icon: Activity,
    color: 'text-lime-600 dark:text-lime-400 bg-lime-50 dark:bg-lime-950/40 border-lime-200 dark:border-lime-800/40',
    badgeBg: 'bg-lime-100 text-lime-800 dark:bg-lime-950/60 dark:text-lime-300',
    pathologyIds: ['alopecia'],
    keywords: ['caida pelo', 'alopecia', 'cabello', 'densidad capilar', 'calvicie', 'biotina'],
  },
  {
    id: 'micosis_parasitos',
    groupId: 'piel',
    title: 'Hongos en Uñas, Pie de Atleta y Verrugas',
    subtitle: 'Uñas engrosadas y amarillentas, maceración interdigital entre dedos, verrugas o piojos',
    patientPhrases: '"Tengo la uña del pie amarilla y quebradiza", "Hongos entre los dedos", "Verruga en la mano"',
    icon: ShieldAlert,
    color: 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-950/40 border-yellow-200 dark:border-yellow-800/40',
    badgeBg: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950/60 dark:text-yellow-300',
    pathologyIds: ['onicomicosis', 'pie_atleta', 'verrugas', 'pediculosis'],
    keywords: ['hongos', 'onicomicosis', 'uñas', 'pie de atleta', 'tiña', 'verrugas', 'piojos', 'pediculosis'],
  },

  // 6. Sentidos: Ojos & Oídos
  {
    id: 'ojos_vision',
    groupId: 'sentidos',
    title: 'Ojo Seco, Picor Ocular y Visión',
    subtitle: 'Sequedad por pantallas o aire acondicionado, lagrimeo reflejo, orzuelos, blefaritis o conjuntivitis',
    patientPhrases: '"Siento arenilla en los ojos", "Ojos rojos y llorosos por pantalla", "Tengo un orzuelo"',
    icon: Eye,
    color: 'text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/40 border-sky-200 dark:border-sky-800/40',
    badgeBg: 'bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300',
    pathologyIds: ['ojo_seco', 'conjuntivitis', 'blefaritis', 'orzuelo_chalazion', 'dmae'],
    keywords: ['ojo seco', 'ojos', 'picor ocular', 'arenilla', 'conjuntivitis', 'orzuelo', 'parpados', 'lagrimas', 'dmae', 'vision'],
  },
  {
    id: 'oidos_vertigo',
    groupId: 'sentidos',
    title: 'Mareos, Vértigo y Acúfenos / Oído',
    subtitle: 'Sensación de giro o inestabilidad, zumbidos constantes en el oído (tinnitus) u otitis',
    patientPhrases: '"Todo me da vueltas", "Tengo un pitido continuo en el oído", "Dolor en el oído por agua"',
    icon: Headphones,
    color: 'text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/40 border-violet-200 dark:border-violet-800/40',
    badgeBg: 'bg-violet-100 text-violet-800 dark:bg-violet-950/60 dark:text-violet-300',
    pathologyIds: ['vertigo', 'tinnitus', 'otitis'],
    keywords: ['vertigo', 'mareo', 'tinnitus', 'acufenos', 'pitido', 'oidos', 'otitis', 'inestabilidad'],
  },

  // 7. Salud Íntima, Hormonal & Urinaria
  {
    id: 'mujer_hormonal',
    groupId: 'intimo',
    title: 'Salud Femenina, Menopausia y Ciclo',
    subtitle: 'Sofocos, sudoración nocturna, dolor menstrual agudo, tensión premenstrual, SOP o sequedad vaginal',
    patientPhrases: '"Sofocos de menopausia", "Reglas muy dolorosas con cólico", "Irregularidades del ciclo"',
    icon: Heart,
    color: 'text-fuchsia-600 dark:text-fuchsia-400 bg-fuchsia-50 dark:bg-fuchsia-950/40 border-fuchsia-200 dark:border-fuchsia-800/40',
    badgeBg: 'bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-950/60 dark:text-fuchsia-300',
    pathologyIds: ['menopausia', 'spm_dismenorrea', 'dismenorrea_juvenil', 'sop', 'endometriosis', 'dispareunia'],
    keywords: ['menopausia', 'sofocos', 'regla', 'menstruacion', 'dismenorrea', 'sop', 'ovario poliquistico', 'endometriosis', 'sequedad vaginal'],
  },
  {
    id: 'urinario_cistitis',
    groupId: 'intimo',
    title: 'Cistitis, Molestias Urinarias e Infección Íntima',
    subtitle: 'Ardor y escozor al orinar, urgencia miccional frecuente, candidiasis vaginal o prevención de cálculos',
    patientPhrases: '"Siento un pinchazo y fuego al orinar", "Voy cada 10 minutos y no sale nada", "Picor vaginal"',
    icon: Droplet,
    color: 'text-pink-600 dark:text-pink-400 bg-pink-50 dark:bg-pink-950/40 border-pink-200 dark:border-pink-800/40',
    badgeBg: 'bg-pink-100 text-pink-800 dark:bg-pink-950/60 dark:text-pink-300',
    pathologyIds: ['cistitis', 'candidiasis_vaginal', 'incontinencia_urinaria', 'vejiga_hiperactiva', 'nicturia', 'litiasis_renal', 'enfermedad_renal_cronica'],
    keywords: ['cistitis', 'orinar', 'escozor', 'ardor al orinar', 'infeccion de orina', 'candidiasis', 'hongos intimos', 'incontinencia', 'calculos', 'riñon'],
  },
  {
    id: 'hombre_prostata',
    groupId: 'intimo',
    title: 'Salud Masculina y Próstata (HBP)',
    subtitle: 'Chorro urinario débil, levantarse muchas veces por la noche a orinar (HBP) o disfunción eréctil',
    patientPhrases: '"Me levanto 3 veces de noche a orinar", "Chorro flojo y con goteo", "Problemas de erección"',
    icon: Activity,
    color: 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800/40',
    badgeBg: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300',
    pathologyIds: ['hbp', 'prostatitis_cronica', 'disfuncion_erectil'],
    keywords: ['prostata', 'hbp', 'hiperplasia', 'chorro debil', 'nicturia hombre', 'prostatitis', 'disfuncion erectil', 'ereccion'],
  },

  // 8. Circulación & Metabolismo
  {
    id: 'piernas_varices',
    groupId: 'metabolico',
    title: 'Piernas Cansadas, Varices y Retorno Venoso',
    subtitle: 'Pesadez y dolor en piernas al final del día, hinchazón de tobillos o manos frías (Raynaud)',
    patientPhrases: '"Tengo las piernas como plomos", "Tobillos hinchados por la tarde", "Manos heladas y blancas"',
    icon: Droplet,
    color: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800/40',
    badgeBg: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300',
    pathologyIds: ['insuficiencia_venosa', 'edema', 'raynaud'],
    keywords: ['piernas cansadas', 'varices', 'circulacion', 'retorno venoso', 'hinchazon', 'edema', 'tobillos', 'retencion liquidos', 'raynaud'],
  },
  {
    id: 'hemorroides_fisuras',
    groupId: 'metabolico',
    title: 'Hemorroides y Molestias Anorrectales',
    subtitle: 'Crisis hemorroidal aguda, picor, inflamación venosa y dolor con la defecación',
    patientPhrases: '"Tengo un bulto doloroso al sentarme", "Picor anal insoportable", "Hemorroides inflamadas"',
    icon: AlertCircle,
    color: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800/40',
    badgeBg: 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300',
    pathologyIds: ['hemorroides'],
    keywords: ['hemorroides', 'almorranas', 'picor anal', 'dolor defecar', 'inflamacion ano'],
  },
  {
    id: 'cardio_tension',
    groupId: 'metabolico',
    title: 'Colesterol, Tensión y Riesgo Vascular',
    subtitle: 'Hipertensión arterial límite o leve, colesterol LDL o triglicéridos elevados, prevención vascular',
    patientPhrases: '"Tengo el colesterol alto en la analítica", "Tensión un poco alta", "Triglicéridos"',
    icon: HeartPulse,
    color: 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/40',
    badgeBg: 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300',
    pathologyIds: ['hipertension', 'colesterol_alto', 'hipertrigliceridemia', 'hipotension_ortostatica', 'cardiopatia_isquemica', 'ictus_prevencion'],
    keywords: ['colesterol', 'hipertension', 'tension', 'trigliceridos', 'cardiovascular', 'corazon', 'arterias', 'presion arterial', 'ictus'],
  },
  {
    id: 'peso_glucosa',
    groupId: 'metabolico',
    title: 'Control de Peso, Glucosa e Hígado Graso',
    subtitle: 'Sobrepeso, resistencia a la insulina, prediabetes, diabetes tipo 2 o hígado graso no alcohólico',
    patientPhrases: '"Quiero perder peso y volumen", "Tengo azúcar en sangre alto", "Me han visto grasa en el hígado"',
    icon: Scale,
    color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/40',
    badgeBg: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300',
    pathologyIds: ['obesidad', 'obesidad_sarcopenica', 'prediabetes', 'diabetes_tipo2', 'glucosa_alta', 'higado_graso', 'cirrosis_hepatica', 'sindrome_metabolico'],
    keywords: ['peso', 'obesidad', 'adelgazar', 'glucosa', 'diabetes', 'azucar', 'higado graso', 'metabolismo', 'grasa visceral'],
  },
  {
    id: 'tiroides_metabolismo',
    groupId: 'metabolico',
    title: 'Tiroides y Metabolismo Lento',
    subtitle: 'Hipotiroidismo, tiroiditis autoinmune (Hashimoto), cansancio metabólico y dificultad de pérdida de peso',
    patientPhrases: '"Tengo tiroides lenta", "Tomo levotiroxina y sigo con cansancio", "Anticuerpos tiroideos"',
    icon: Activity,
    color: 'text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/40 border-teal-200 dark:border-teal-800/40',
    badgeBg: 'bg-teal-100 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300',
    pathologyIds: ['hipotiroidismo', 'hipertiroidismo', 'tiroiditis_hashimoto', 'enfermedad_tiroidea_autoinmune'],
    keywords: ['tiroides', 'hipotiroidismo', 'hashimoto', 'eutirox', 'metabolismo lento', 'frio', 'tiroiditis'],
  },
  {
    id: 'tabaquismo',
    groupId: 'metabolico',
    title: 'Cesación Tabáquica y Ansiedad por Fumar',
    subtitle: 'Apoyo para dejar de fumar, control del deseo compulsivo y del síndrome de abstinencia',
    patientPhrases: '"Quiero dejar de fumar", "Tengo mucha ansiedad por no fumar", "Manejo del craving"',
    icon: CigaretteOff,
    color: 'text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800/40',
    badgeBg: 'bg-slate-100 text-slate-800 dark:bg-slate-950/60 dark:text-slate-300',
    pathologyIds: ['tabaquismo'],
    keywords: ['tabaco', 'fumar', 'dejar de fumar', 'nicotina', 'ansiedad fumar', 'craving', 'abstinencia'],
  },
];

export function PathologyGuidePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const searchQuery = searchParams.get('q') || '';
  const activeReasonId = searchParams.get('reason') || null;
  const [selectedGroup, setSelectedGroup] = useState<string>('todos');
  const [selectedSystem, setSelectedSystem] = useState<BodySystem | ''>('');
  const [activePathology, setActivePathology] = useState<DbPathology | null>(null);

  const setSearchQuery = (val: string) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (val.trim()) next.set('q', val);
      else next.delete('q');
      return next;
    }, { replace: true });
  };

  const pathologies = useLiveQuery(
    () => db.pathologies.where('tombstone').equals(0).toArray(),
    []
  );

  // Motivos filtrados por grupo y texto de búsqueda
  const visibleReasons = useMemo(() => {
    let list = COMMON_REASONS;

    // Filtro por grupo clínico
    if (selectedGroup !== 'todos') {
      list = list.filter((r) => r.groupId === selectedGroup);
    }

    // Filtro reactivo por búsqueda de texto
    if (searchQuery.trim().length > 0) {
      const q = normalize(searchQuery.trim());
      list = list.filter((r) => {
        const matchTitle = normalize(r.title).includes(q);
        const matchSub = normalize(r.subtitle).includes(q);
        const matchPhrases = normalize(r.patientPhrases).includes(q);
        const matchKeywords = r.keywords.some((kw) => normalize(kw).includes(q));
        const matchIds = r.pathologyIds.some((pid) => normalize(pid).includes(q));
        return matchTitle || matchSub || matchPhrases || matchKeywords || matchIds;
      });
    }

    return list;
  }, [selectedGroup, searchQuery]);

  // Patologías clínicas filtradas según selección
  const filteredPathologies = useMemo(() => {
    if (!pathologies) return [];

    let list = pathologies;

    // 1. Filtro por motivo de consulta activo
    if (activeReasonId) {
      const reason = COMMON_REASONS.find((r) => r.id === activeReasonId);
      if (reason) {
        list = list.filter((p) => reason.pathologyIds.includes(p.id));
      }
    }

    // 2. Filtro por sistema biológico anatómico
    if (selectedSystem) {
      list = list.filter((p) => p.sistemas && p.sistemas.includes(selectedSystem));
    }

    // 3. Búsqueda por texto libre
    if (searchQuery.trim().length > 0) {
      const q = normalize(searchQuery.trim());
      list = list.filter((p) => {
        const matchName = normalize(p.nombre).includes(q);
        const matchId = normalize(p.id).includes(q);
        const matchDef = p.definicion ? normalize(p.definicion).includes(q) : false;
        const matchSymptoms = p.sintomas?.some((s) => normalize(s).includes(q)) ?? false;
        const matchCauses = p.causas?.some((c) => normalize(c).includes(q)) ?? false;
        return matchName || matchId || matchDef || matchSymptoms || matchCauses;
      });
    }

    return list;
  }, [pathologies, activeReasonId, selectedSystem, searchQuery]);

  // Motivo seleccionado actualmente
  const activeReason = useMemo(() => {
    return activeReasonId ? COMMON_REASONS.find((r) => r.id === activeReasonId) || null : null;
  }, [activeReasonId]);

  const handleSelectReason = (id: string) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (next.get('reason') === id) {
        next.delete('reason');
      } else {
        next.set('reason', id);
      }
      return next;
    }, { replace: true });
    setSelectedSystem('');
  };

  const handleClearFilters = () => {
    setSelectedGroup('todos');
    setSelectedSystem('');
    setSearchParams({}, { replace: true });
  };

  return (
    <div className="space-y-6 pb-12">
      {/* CABECERA & HERO CENTRADO EN EL MOTIVO DEL PACIENTE */}
      <div className="rounded-2xl border border-border/80 bg-gradient-to-b from-card via-card/90 to-card/60 p-5 sm:p-7 shadow-xs">
        <div className="max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
            <Stethoscope className="w-3.5 h-3.5" />
            <span>Guía de Mostrador Centrada en el Síntoma</span>
            <span className="text-emerald-500/40">·</span>
            <span>32 Motivos · 146 Patologías Clínicas</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground font-heading">
            ¿Qué molestia o síntoma consulta el cliente?
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            El cliente rara vez pide un principio activo concreto; acude al mostrador con una frase: 
            <span className="text-foreground font-medium italic"> "Me arde el estómago", "No puedo dormir", "Me duelen las rodillas"</span>. 
            Localiza aquí el motivo exacto para obtener el protocolo de fitoterapia, suplementos, homeopatía y señales de alarma médica antes de dispensar.
          </p>

          {/* BUSCADOR REACTIVO DE SÍNTOMAS */}
          <div className="pt-2 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              type="search"
              placeholder="Escribe lo que dice el cliente: ej. ardor, insomnio, caída pelo, migraña, cistitis, gases, pesadez piernas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10 h-12 text-sm sm:text-base rounded-xl bg-background border-border/80 shadow-2xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* TABS DE ÁREAS CLÍNICAS DE MOSTRADOR */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-primary" />
            <span>Áreas Clínicas de Mostrador</span>
          </span>
          {(activeReasonId || selectedSystem || searchQuery || selectedGroup !== 'todos') && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="text-xs font-medium text-primary hover:underline flex items-center gap-1"
            >
              <span>Restablecer todo</span>
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {REASON_GROUPS.map((group) => {
            const GroupIcon = group.icon;
            const isGroupActive = selectedGroup === group.id;
            return (
              <button
                key={group.id}
                type="button"
                onClick={() => {
                  setSelectedGroup(group.id);
                  if (activeReasonId) {
                    const r = COMMON_REASONS.find((item) => item.id === activeReasonId);
                    if (r && group.id !== 'todos' && r.groupId !== group.id) {
                      setActiveReasonId(null);
                    }
                  }
                }}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all border shrink-0 cursor-pointer',
                  isGroupActive
                    ? 'bg-primary text-primary-foreground border-primary shadow-2xs font-semibold'
                    : 'bg-card text-muted-foreground border-border/70 hover:border-border hover:text-foreground hover:bg-muted/40'
                )}
              >
                <GroupIcon className="w-3.5 h-3.5" />
                <span>{group.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* GRID DE MOTIVOS DE CONSULTA MÁS COMUNES EN FARMACIA */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <HeartPulse className="w-4 h-4 text-primary" />
            <span>Motivos de Consulta Más Frecuentes ({visibleReasons.length})</span>
          </h2>
          {activeReasonId && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setActiveReasonId(null)}
              className="text-xs h-7 text-muted-foreground hover:text-foreground"
            >
              Ver todas las patologías
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {visibleReasons.map((reason) => {
            const Icon = reason.icon;
            const isSelected = activeReasonId === reason.id;
            return (
              <button
                key={reason.id}
                type="button"
                onClick={() => handleSelectReason(reason.id)}
                className={cn(
                  'text-left p-3.5 rounded-xl border transition-all cursor-pointer relative overflow-hidden group flex flex-col justify-between',
                  isSelected
                    ? 'border-primary ring-2 ring-primary/20 bg-primary/5 shadow-xs'
                    : 'border-border/80 bg-card hover:border-primary/40 hover:bg-muted/30'
                )}
              >
                <div className="space-y-2.5 w-full">
                  <div className="flex items-start justify-between gap-2">
                    <div className={cn('p-2 rounded-lg border shrink-0', reason.color)}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-md', reason.badgeBg)}>
                      {reason.pathologyIds.length} {reason.pathologyIds.length === 1 ? 'patología' : 'patologías'}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-semibold text-xs sm:text-sm text-foreground group-hover:text-primary transition-colors leading-snug">
                      {reason.title}
                    </h3>
                    <p className="text-[11px] text-muted-foreground line-clamp-2 mt-1 leading-relaxed">
                      {reason.subtitle}
                    </p>
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-border/50 text-[10px] text-muted-foreground/90 italic truncate">
                  {reason.patientPhrases}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* BANNER INFORMATIVO SI HAY UN MOTIVO SELECCIONADO */}
      {activeReason && (
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={cn('p-2.5 rounded-xl border shrink-0', activeReason.color)}>
              <activeReason.icon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-primary uppercase tracking-wide">
                  Motivo de mostrador filtrado:
                </span>
                <span className="text-xs bg-primary/10 text-primary px-2 py-0.2 rounded-md font-semibold">
                  {filteredPathologies.length} patologías asociadas
                </span>
              </div>
              <h3 className="text-base font-bold text-foreground mt-0.5">
                {activeReason.title}
              </h3>
              <p className="text-xs text-muted-foreground">
                Frase del cliente: <span className="italic text-foreground">"{activeReason.patientPhrases}"</span>
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setActiveReasonId(null)}
            className="text-xs shrink-0 self-end sm:self-center"
          >
            Quitar filtro de motivo
          </Button>
        </div>
      )}

      {/* FILTROS POR SISTEMA BIOLÓGICO */}
      <div className="space-y-2 pt-1">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
          <Activity className="w-3.5 h-3.5 text-primary" />
          <span>O filtrar por sistema anatómico:</span>
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-none">
          <button
            type="button"
            onClick={() => setSelectedSystem('')}
            className={cn(
              'px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors border shrink-0',
              !selectedSystem
                ? 'bg-foreground text-background border-foreground font-semibold'
                : 'bg-card text-muted-foreground border-border/60 hover:text-foreground'
            )}
          >
            Todos los sistemas
          </button>
          {BODY_SYSTEM_CHIPS.map((chip) => {
            const isChipSelected = selectedSystem === chip.id;
            return (
              <button
                key={chip.id}
                type="button"
                onClick={() => setSelectedSystem(isChipSelected ? '' : (chip.id as BodySystem))}
                className={cn(
                  'px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors border shrink-0',
                  isChipSelected
                    ? 'bg-primary text-primary-foreground border-primary font-semibold shadow-2xs'
                    : 'bg-card text-muted-foreground border-border/60 hover:text-foreground hover:border-primary/40'
                )}
              >
                {chip.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* LISTADO DE PATOLOGÍAS CLÍNICAS COINCIDENTES */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Fichas Clínicas de Actuación
            </h2>
            <span className="text-xs bg-muted px-2 py-0.5 rounded-full font-medium text-foreground">
              {filteredPathologies.length} disponibles
            </span>
          </div>

          {(activeReasonId || selectedSystem || searchQuery) && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="text-xs text-primary hover:underline flex items-center gap-1"
            >
              <span>Limpiar filtros</span>
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {filteredPathologies.length === 0 ? (
          <div className="p-12 text-center rounded-2xl border border-dashed border-border bg-card/40 space-y-3">
            <Stethoscope className="w-8 h-8 text-muted-foreground mx-auto" />
            <h3 className="font-medium text-foreground text-sm">
              No se encontraron patologías para el criterio indicado
            </h3>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              Intenta buscar por un síntoma más general como "sueño", "dolor", "ardor", "gases" o "congestión".
            </p>
            <Button variant="outline" size="sm" onClick={handleClearFilters}>
              Mostrar todas las patologías
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {filteredPathologies.map((pathology) => {
              const evidenceConfig = getEvidenceConfig(pathology.evidencia);
              const naturalCount =
                (pathology.tratamientoNatural.fitoterapia?.length || 0) +
                (pathology.tratamientoNatural.suplementos?.length || 0) +
                (pathology.tratamientoNatural.homeopatia?.length || 0) +
                (pathology.tratamientoNatural.aceites?.length || 0);

              const hasRedFlags = Boolean(pathology.cuandoConsultar);
              const hasAlerts = (pathology.alertasFarmaceuticas?.length || 0) > 0;

              return (
                <button
                  key={pathology.id}
                  type="button"
                  onClick={() => setActivePathology(pathology)}
                  className="p-4 rounded-xl border border-border/80 bg-card hover:border-primary/50 hover:shadow-xs transition-all cursor-pointer flex flex-col justify-between group text-left w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <div className="space-y-2 w-full">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-primary inline-flex items-center gap-1">
                        <Stethoscope className="w-3.5 h-3.5" />
                        <span>Ficha Clínica</span>
                      </span>
                      <span className={cn('text-[11px] font-medium px-2 py-0.5 rounded-full', evidenceConfig.color)}>
                        Evidencia {pathology.evidencia}
                      </span>
                    </div>

                    <h3 className="font-bold text-base text-foreground group-hover:text-primary transition-colors">
                      {pathology.nombre}
                    </h3>

                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {pathology.definicion}
                    </p>

                    {/* Síntomas frecuentes de presentación */}
                    {pathology.sintomas && pathology.sintomas.length > 0 && (
                      <div className="pt-1 flex flex-wrap items-center gap-1">
                        <span className="text-[11px] text-muted-foreground font-medium">Síntomas:</span>
                        {pathology.sintomas.slice(0, 3).map((s, idx) => (
                          <span
                            key={idx}
                            className="text-[11px] bg-muted px-1.5 py-0.5 rounded text-foreground capitalize"
                          >
                            {s}
                          </span>
                        ))}
                        {pathology.sintomas.length > 3 && (
                          <span className="text-[10px] text-muted-foreground">
                            +{pathology.sintomas.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Resumen de recursos naturales y alertas */}
                  <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between text-[11px] w-full">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <span className="font-semibold text-foreground">{naturalCount}</span>
                      <span>activos de recomendación</span>
                    </div>

                    {hasRedFlags ? (
                      <span className="inline-flex items-center gap-1 text-red-600 dark:text-red-400 font-medium">
                        <AlertTriangle className="w-3 h-3" />
                        <span>Criterio derivación</span>
                      </span>
                    ) : hasAlerts ? (
                      <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium">
                        <ShieldAlert className="w-3 h-3" />
                        <span>Alertas fármaco</span>
                      </span>
                    ) : (
                      <span className="text-primary font-medium inline-flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                        <span>Ver protocolo</span>
                        <ArrowRight className="w-3 h-3" />
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL DETALLE DE PATOLOGÍA CLÍNICA COMPLETO */}
      {activePathology && (
        <PathologyDetail
          pathology={activePathology}
          onClose={() => setActivePathology(null)}
        />
      )}
    </div>
  );
}
