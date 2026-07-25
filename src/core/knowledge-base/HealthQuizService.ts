/**
 * Servicio de Quiz de Salud - Recomendaciones Personalizadas
 * 
 * Sistema de recomendaciones basado en objetivos de salud del usuario.
 */

import { getCombinedKnowledgeBase } from './ExpandedIngredients';
import { synergyGraphService } from './SynergyGraph';
import type { HealthObjective, IngredientInfo } from './ingredients';

// Tipos para el quiz
export interface QuizQuestion {
  id: string;
  pregunta: string;
  opciones: QuizOption[];
}

export interface QuizOption {
  id: string;
  texto: string;
  icono?: string;
  objetivos: HealthObjective[];
  weights?: Record<HealthObjective, number>;
}

export interface UserProfile {
  objetivos: Record<HealthObjective, number>;
  condiciones_medicas: MedicalCondition[];
  presupuesto: 'bajo' | 'medio' | 'alto';
  formato_preferido: 'capsulas' | 'polvo' | 'liquido' | 'cualquiera';
}

export interface MedicalCondition {
  id: string;
  nombre: string;
  nivel: 'absoluta' | 'relativa' | 'precaución';
}

export interface IngredientRecommendation {
  ingrediente: IngredientInfo;
  puntuacion: number;
  razones: string[];
  sinergias_principales: string[];
  contraindicaciones_potenciales: string[];
  dosis_sugerida: string;
  precio_estimado?: string;
}

// Preguntas del quiz
export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 'objetivo_principal',
    pregunta: '¿Cuál es tu objetivo principal de salud?',
    opciones: [
      { id: 'inmunidad', texto: 'Fortalecer el sistema inmunológico', icono: '🛡️', objetivos: ['inmunidad'] },
      { id: 'energia', texto: 'Aumentar energía y vitalidad', icono: '⚡', objetivos: ['energia'] },
      { id: 'sueno', texto: 'Mejorar calidad del sueño', icono: '😴', objetivos: ['sueno'] },
      { id: 'articula', texto: 'Salud articular y movilidad', icono: '🦴', objetivos: ['articula'] },
      { id: 'cerebro', texto: 'Función cognitiva y memoria', icono: '🧠', objetivos: ['cerebro'] },
      { id: 'corazon', texto: 'Salud cardiovascular', icono: '❤️', objetivos: ['corazon'] },
      { id: 'piel', texto: 'Salud de la piel y anti-edad', icono: '✨', objetivos: ['piel', 'antiedad'] },
      { id: 'peso', texto: 'Control de peso y metabolismo', icono: '⚖️', objetivos: ['peso', 'energia'] }
    ]
  },
  {
    id: 'objetivos_secundarios',
    pregunta: '¿Tienes otros objetivos de salud? (Selecciona los que apliquen)',
    opciones: [
      { id: 'inmunidad_2', texto: 'Fortalecer defensas', icono: '🛡️', objetivos: ['inmunidad'], weights: { 'inmunidad': 0.5 } },
      { id: 'energia_2', texto: 'Más energía', icono: '⚡', objetivos: ['energia'], weights: { 'energia': 0.5 } },
      { id: 'sueno_2', texto: 'Dormir mejor', icono: '😴', objetivos: ['sueno'], weights: { 'sueno': 0.5 } },
      { id: 'digestion', texto: 'Salud digestiva', icono: '🌿', objetivos: ['digestion'] },
      { id: 'antioxidantes', texto: 'Protección antioxidante', icono: '🛡️', objetivos: ['antioxidantes'] },
      { id: 'huesos', texto: 'Fortalecer huesos', icono: '🦴', objetivos: ['huesos'] }
    ]
  },
  {
    id: 'condiciones',
    pregunta: '¿Tienes alguna de estas condiciones médicas?',
    opciones: [
      { id: 'embarazo', texto: 'Embarazo o lactancia', icono: '🤰', objetivos: [] },
      { id: 'diabetes', texto: 'Diabetes', icono: '🩺', objetivos: [] },
      { id: 'hipertension', texto: 'Hipertensión', icono: '💓', objetivos: [] },
      { id: 'medicamentos', texto: 'Tomo medicamentos regularmente', icono: '💊', objetivos: [] },
      { id: 'ninguna', texto: 'Ninguna condición relevante', icono: '✅', objetivos: [] }
    ]
  },
  {
    id: 'presupuesto',
    pregunta: '¿Cuál es tu presupuesto aproximado mensual?',
    opciones: [
      { id: 'bajo', texto: 'Económico (hasta $30/mes)', icono: '💵', objetivos: [] },
      { id: 'medio', texto: 'Moderado ($30-80/mes)', icono: '💰', objetivos: [] },
      { id: 'alto', texto: 'Premium ($80+/mes)', icono: '💎', objetivos: [] }
    ]
  },
  {
    id: 'formato',
    pregunta: '¿Qué formato de suplementos prefieres?',
    opciones: [
      { id: 'capsulas', texto: 'Cápsulas o pastillas', icono: '💊', objetivos: [] },
      { id: 'polvo', texto: 'Polvo para mezclar', icono: '🥄', objetivos: [] },
      { id: 'liquido', texto: 'Líquido o gotas', icono: '💧', objetivos: [] },
      { id: 'cualquiera', texto: 'Me da igual el formato', icono: '✨', objetivos: [] }
    ]
  }
];

// Mapeo de condiciones médicas a contraindicaciones
const CONDITION_CONTRAINDICATIONS: Record<string, string[]> = {
  'embarazo': ['vitamina_a', 'saw_palmetto', 'l_arginina', 'l_citrulina'],
  'diabetes': ['cromo'], // Puede afectar glucosa
  'hipertension': ['cafeina', 'l_arginina'],
  'medicamentos': [] // Requerir consulta médica
};

class HealthQuizService {
  private static instance: HealthQuizService;

  private constructor() {}

  static getInstance(): HealthQuizService {
    if (!HealthQuizService.instance) {
      HealthQuizService.instance = new HealthQuizService();
    }
    return HealthQuizService.instance;
  }

  /**
   * Genera un perfil de usuario basado en las respuestas del quiz
   */
  generateUserProfile(answers: Record<string, string[]>): UserProfile {
    const objetivos: Record<HealthObjective, number> = {} as Record<HealthObjective, number>;
    const condiciones_medicas: MedicalCondition[] = [];

    // Procesar respuestas
    for (const [questionId, selectedOptions] of Object.entries(answers)) {
      const question = QUIZ_QUESTIONS.find(q => q.id === questionId);
      if (!question) continue;

      for (const optionId of selectedOptions) {
        const option = question.opciones.find(o => o.id === optionId);
        if (!option) continue;

        // Procesar según tipo de pregunta
        if (questionId === 'objetivo_principal') {
          for (const obj of option.objetivos) {
            objetivos[obj] = (objetivos[obj] || 0) + 1;
          }
        } else if (questionId === 'objetivos_secundarios') {
          if (option.weights) {
            for (const [obj, weight] of Object.entries(option.weights)) {
              objetivos[obj as HealthObjective] = (objetivos[obj as HealthObjective] || 0) + weight;
            }
          } else {
            for (const obj of option.objetivos) {
              objetivos[obj] = (objetivos[obj] || 0) + 0.5;
            }
          }
        } else if (questionId === 'condiciones') {
          if (optionId !== 'ninguna' && optionId !== 'medicamentos') {
            condiciones_medicas.push({
              id: optionId,
              nombre: option.texto,
              nivel: optionId === 'embarazo' ? 'absoluta' : 'precaución'
            });
          }
        }
      }
    }

    // Normalizar objetivos
    const maxScore = Math.max(...Object.values(objetivos), 1);
    for (const obj of Object.keys(objetivos)) {
      objetivos[obj as HealthObjective] = objetivos[obj as HealthObjective] / maxScore;
    }

    return {
      objetivos,
      condiciones_medicas,
      presupuesto: (answers.presupuesto?.[0] as 'bajo' | 'medio' | 'alto') || 'medio',
      formato_preferido: (answers.formato?.[0] as 'capsulas' | 'polvo' | 'liquido' | 'cualquiera') || 'cualquiera'
    };
  }

  /**
   * Genera recomendaciones de ingredientes basadas en el perfil
   */
  generateRecommendations(profile: UserProfile, limit: number = 5): IngredientRecommendation[] {
    const knowledgeBase = getCombinedKnowledgeBase();
    const contraindicados = this.getContraindicatedIngredients(profile.condiciones_medicas);
    
    const recommendations: IngredientRecommendation[] = [];

    for (const [ingredientId, ingredient] of Object.entries(knowledgeBase)) {
      // Skip ingredientes contraindicados
      if (contraindicados.includes(ingredientId)) continue;

      // Calcular puntuación basada en objetivos
      let puntuacion = 0;
      const razones: string[] = [];
      
      for (const objetivo of ingredient.objetivos_salud) {
        const weight = profile.objetivos[objetivo] || 0;
        if (weight > 0) {
          puntuacion += weight * 100;
          razones.push(`Apoya: ${objetivo}`);
        }
      }

      // Bonus por sinergias con otros ingredientes recomendados
      const sinergias = synergyGraphService.obtenerSinergiasDe(ingredientId);
      const sinergiasAltas = sinergias.filter(s => s.nivel === 'alto').length;
      puntuacion += sinergiasAltas * 20;

      // Penalizar si hay contraindicaciones relativas
      if (ingredient.contraindicaciones?.some(c => c.nivel === 'precaución')) {
        puntuacion *= 0.8;
      }

      if (puntuacion > 0) {
        recommendations.push({
          ingrediente: ingredient,
          puntuacion,
          razones: [...new Set(razones)],
          sinergias_principales: sinergias
            .filter(s => s.nivel === 'alto')
            .slice(0, 3)
            .map(s => s.hacia),
          contraindicaciones_potenciales: ingredient.contraindicaciones
            ?.filter(c => c.nivel !== 'absoluta')
            .map(c => `${c.condicion}: ${c.descripcion}`) || [],
          dosis_sugerida: ingredient.dosis_recomendada || 'Consultar',
          precio_estimado: this.estimatePrice(ingredient.categoria, profile.presupuesto)
        });
      }
    }

    // Ordenar por puntuación y limitar
    return recommendations
      .sort((a, b) => b.puntuacion - a.puntuacion)
      .slice(0, limit);
  }

  /**
   * Genera un régimen completo de suplementos
   */
  generateRegimen(profile: UserProfile): SupplementRegimen {
    const recommendations = this.generateRecommendations(profile, 5);
    
    const morning: string[] = [];
    const afternoon: string[] = [];
    const evening: string[] = [];
    const withMeals: string[] = [];

    // Clasificar por momento del día
    for (const rec of recommendations) {
      const id = rec.ingrediente.id;
      
      // Vitaminas liposolubles con comidas
      if (['vitamina_a', 'vitamina_d3', 'vitamina_e', 'vitamina_k2', 'omega_3'].includes(id)) {
        withMeals.push(id);
      }
      // Energizantes por la mañana
      else if (rec.ingrediente.objetivos_salud.includes('energia')) {
        morning.push(id);
      }
      // Relajantes por la noche
      else if (rec.ingrediente.objetivos_salud.includes('sueno')) {
        evening.push(id);
      }
      // Resto en la tarde
      else {
        afternoon.push(id);
      }
    }

    return {
      ingredientes: recommendations,
      horario: {
        maniana: morning,
        tarde: afternoon,
        noche: evening,
        conComidas: withMeals
      },
      consejos: this.generateTips(recommendations)
    };
  }

  /**
   * Obtiene ingredientes contraindicados
   */
  private getContraindicatedIngredients(conditions: MedicalCondition[]): string[] {
    const contraindicados: string[] = [];
    
    for (const condition of conditions) {
      const ids = CONDITION_CONTRAINDICATIONS[condition.id] || [];
      if (condition.nivel === 'absoluta') {
        contraindicados.push(...ids);
      }
    }

    return [...new Set(contraindicados)];
  }

  /**
   * Estima el precio según categoría y presupuesto
   */
  private estimatePrice(categoria: string, presupuesto: string): string {
    const basePrices: Record<string, number> = {
      vitaminas: 15,
      minerales: 12,
      aminoacidos: 20,
      botanicos: 18,
      enzimas: 25,
      acidos_grasos: 20,
      probioticos: 25,
      antioxidantes: 20,
      extractos: 22,
      otros: 18
    };

    const base = basePrices[categoria] || 18;
    
    switch (presupuesto) {
      case 'bajo': return `$${(base * 0.7).toFixed(0)}-$${base}`;
      case 'alto': return `$${base}-$${(base * 1.5).toFixed(0)}`;
      default: return `$${base}`;
    }
  }

  /**
   * Genera consejos prácticos
   */
  private generateTips(recommendations: IngredientRecommendation[]): string[] {
    const tips: string[] = [];
    
    // Verificar sinergias entre recomendados
    const ids = recommendations.map(r => r.ingrediente.id);
    for (const rec of recommendations) {
      for (const sinergiaId of rec.sinergias_principales) {
        if (ids.includes(sinergiaId)) {
          tips.push(`💊 Combina ${rec.ingrediente.nombre} con ${sinergiaId} para mayor efecto`);
        }
      }
    }

    // Consejos generales
    if (recommendations.some(r => r.ingrediente.id.includes('omega'))) {
      tips.push('🐟 Toma omega-3 con las comidas para mejor absorción');
    }
    
    if (recommendations.some(r => r.ingrediente.id.includes('hierro'))) {
      tips.push('🥝 Toma hierro con vitamina C para mejor absorción');
    }
    
    if (recommendations.some(r => r.ingrediente.id.includes('magnesio'))) {
      tips.push('🌙 El magnesio es mejor tomarlo por la noche');
    }

    if (recommendations.some(r => r.ingrediente.id.includes('zinc'))) {
      tips.push('⚠️ El zinc puede competir con hierro - tómalos en diferentes momentos');
    }

    return [...new Set(tips)].slice(0, 5);
  }
}

export interface SupplementRegimen {
  ingredientes: IngredientRecommendation[];
  horario: {
    maniana: string[];
    tarde: string[];
    noche: string[];
    conComidas: string[];
  };
  consejos: string[];
}

export const healthQuizService = HealthQuizService.getInstance();
