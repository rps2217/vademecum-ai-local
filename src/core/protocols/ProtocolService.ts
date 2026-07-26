/**
 * ProtocolService - Sistema de Protocolos de Suplementación
 * 
 * Genera rutinas de suplementación personalizadas basadas en objetivos de salud
 * usando la base de conocimiento para recomendaciones basadas en evidencia.
 */

import { knowledgeLoader } from '../knowledge-base';
import { synergyEngineV2 } from '../knowledge-base';
import { logger } from '../../services/LoggerService';

export interface ProtocolObjective {
  id: string;
  nombre: string;
  descripcion: string;
  icon: string;
  keywords: string[];
}

export interface ProtocolIngredient {
  id: string;
  nombre: string;
  categoria: string;
  dosis: string;
  momento: 'manana' | 'mediodia' | 'tarde' | 'noche' | 'con_comidas';
  synergyNote?: string;
  evidencia: 'A' | 'B' | 'C';
}

export interface SupplementProtocol {
  objetivo: ProtocolObjective;
  duracion: string;
  ingredientes: ProtocolIngredient[];
  sinergias: Array<{
    ingredientes: string[];
    tipo: string;
    beneficio: string;
  }>;
  advertencias: string[];
  contraindicaciones: string[];
}

export interface ProtocolGeneratorOptions {
  incluyeAntagonismos: boolean;
  modoConservador: boolean;
  priorizarNatural: boolean;
}

// Protocolos predefinidos por objetivo
const OBJECTIVES: ProtocolObjective[] = [
  {
    id: 'sueno',
    nombre: 'Mejorar el Sueño',
    descripcion: 'Optimiza la calidad y duración del descanso nocturno',
    icon: '🌙',
    keywords: ['insomnio', 'sueño', 'dormir', 'descanso', 'melatonina', 'valeriana'],
  },
  {
    id: 'inmunidad',
    nombre: 'Reforzar Inmunidad',
    descripcion: 'Fortalece el sistema inmune de forma natural',
    icon: '🛡️',
    keywords: ['inmune', 'inmunidad', 'resfriado', 'defensas', 'equinacea', 'vitamina c', 'zinc'],
  },
  {
    id: 'energia',
    nombre: 'Aumentar Energía',
    descripcion: 'Mejora la vitalidad y reduce la fatiga',
    icon: '⚡',
    keywords: ['energia', 'fatiga', 'vitaminas b', 'coq10', 'magnesio', 'hierro'],
  },
  {
    id: 'stress',
    nombre: 'Reducir Estrés',
    descripcion: 'Promueve la calma y reduce la ansiedad',
    icon: '🧘',
    keywords: ['ansiedad', 'estres', 'relax', 'ashwagandha', 'pasiflora', 'gaba'],
  },
  {
    id: 'articulaciones',
    nombre: 'Salud Articular',
    descripcion: 'Apoya la movilidad y reduce inflamación',
    icon: '🦴',
    keywords: ['articulaciones', 'colageno', 'glucosamina', 'artritis', 'inflamacion', 'curcuma'],
  },
  {
    id: 'cognicion',
    nombre: 'Función Cognitiva',
    descripcion: 'Mejora memoria, concentración y claridad mental',
    icon: '🧠',
    keywords: ['memoria', 'concentracion', 'cerebro', 'ginkgo', 'omega_3', 'fosfatidilserina'],
  },
  {
    id: 'digestion',
    nombre: 'Salud Digestiva',
    descripcion: 'Optimiza la función gastrointestinal',
    icon: '🌿',
    keywords: ['digestion', 'probioticos', 'enzimas', 'fibra', 'prebioticos'],
  },
  {
    id: 'cardiovascular',
    nombre: 'Salud Cardiovascular',
    descripcion: 'Apoya la función del corazón y vasos sanguíneos',
    icon: '❤️',
    keywords: ['corazon', 'cardiovascular', 'omega_3', 'coq10', 'ajo'],
  },
];

// Mapeo de momentos del día para ingredientes
const MOMENTOS_DIA = {
  manana: ['vitamina b12', 'vitamina c', 'hierro', 'ginseng'],
  mediodia: ['vitaminas', 'minerales'],
  tarde: ['magnesio', 'vitaminas b'],
  noche: ['valeriana', 'melatonina', 'pasiflora', 'magnesio'],
  con_comidas: ['omega_3', 'probióticos', 'enzimas', 'hierro'],
} as const;

class ProtocolService {
  private static instance: ProtocolService;
  private initialized: boolean = false;

  static getInstance(): ProtocolService {
    if (!ProtocolService.instance) {
      ProtocolService.instance = new ProtocolService();
    }
    return ProtocolService.instance;
  }

  async init(): Promise<void> {
    if (this.initialized) return;
    await knowledgeLoader.load();
    this.initialized = true;
    logger.success('ProtocolService inicializado', 'Protocols');
  }

  /**
   * Obtener todos los objetivos disponibles
   */
  getObjectives(): ProtocolObjective[] {
    return OBJECTIVES;
  }

  /**
   * Generar un protocolo de suplementación
   */
  async generateProtocol(
    objetivoId: string,
    options: Partial<ProtocolGeneratorOptions> = {}
  ): Promise<SupplementProtocol | null> {
    await this.init();

    const objetivo = OBJECTIVES.find(o => o.id === objetivoId);
    if (!objetivo) {
      logger.warn(`Objetivo no encontrado: ${objetivoId}`, 'Protocols');
      return null;
    }

    const defaultOptions: ProtocolGeneratorOptions = {
      incluyeAntagonismos: false,
      modoConservador: true,
      priorizarNatural: true,
      ...options,
    };

    // Buscar ingredientes relevantes en la KB
    const ingredientesRelevantes = await this.findRelevantIngredients(objetivo.keywords);
    
    // Filtrar antagonismos si es necesario
    let ingredientesFinales = ingredientesRelevantes;
    if (!defaultOptions.incluyeAntagonismos) {
      ingredientesFinales = this.filterOutAntagonisms(ingredientesRelevantes);
    }

    // Asignar momentos del día
    const ingredientesConMomento = this.assignMomento(ingredientesFinales);

    // Calcular sinergias
    const sinergias = this.findSynergies(ingredientesFinales.map(i => i.id));

    // Recopilar advertencias y contraindicaciones
    const { advertencias, contraindicaciones } = this.gatherWarnings(ingredientesFinales);

    return {
      objetivo,
      duracion: this.suggestDuration(objetivoId),
      ingredientes: ingredientesConMomento,
      sinergias,
      advertencias,
      contraindicaciones,
    };
  }

  /**
   * Buscar ingredientes relevantes en la KB
   */
  private async findRelevantIngredients(keywords: string[]): Promise<ProtocolIngredient[]> {
    const allIngredients = knowledgeLoader.getAll();
    const resultados: ProtocolIngredient[] = [];

    for (const ing of allIngredients) {
      // Buscar coincidencia por keywords
      const textoIndexado = [
        ing.nombre,
        ing.nombreCientifico || '',
        ...(ing.nombresAlternativos || []),
        ...(ing.indicaciones || []),
        ...(ing.sistemas || []),
      ].join(' ').toLowerCase();

      const matches = keywords.some(kw => 
        textoIndexado.includes(kw.toLowerCase())
      );

      if (matches) {
        resultados.push({
          id: ing.id,
          nombre: ing.nombre,
          categoria: ing.categoria,
          dosis: this.suggestDosage(ing),
          momento: 'con_comidas', // Default
          evidencia: 'B', // Default
        });
      }
    }

    // Limitar a los más relevantes (máx 8)
    return resultados.slice(0, 8);
  }

  /**
   * Filtrar ingredientes con antagonismos
   */
  private filterOutAntagonisms(ingredientes: ProtocolIngredient[]): ProtocolIngredient[] {
    const ids = ingredientes.map(i => i.id);
    const filtered: ProtocolIngredient[] = [];

    for (const ing of ingredientes) {
      const antagonismos = synergyEngineV2.checkAntagonisms(ids);
      const tieneAntagonismo = antagonismos.some(a => 
        a.ingredienteA === ing.id || a.ingredienteB === ing.id
      );
      
      if (!tieneAntagonismo) {
        filtered.push(ing);
      }
    }

    return filtered;
  }

  /**
   * Asignar momento del día a ingredientes
   */
  private assignMomento(ingredientes: ProtocolIngredient[]): ProtocolIngredient[] {
    return ingredientes.map(ing => {
      const momento = Object.entries(MOMENTOS_DIA).find(([, keywords]) =>
        keywords.some(kw => ing.nombre.toLowerCase().includes(kw.toLowerCase()))
      )?.[0] as ProtocolIngredient['momento'] || 'con_comidas';

      return { ...ing, momento };
    });
  }

  /**
   * Encontrar sinergias entre ingredientes
   */
  private findSynergies(ingredientIds: string[]): SupplementProtocol['sinergias'] {
    const sinergias: SupplementProtocol['sinergias'] = [];
    const analisis = synergyEngineV2.analyze(ingredientIds);

    if (analisis.sinergiasDetectadas) {
      analisis.sinergiasDetectadas.forEach((syn: any) => {
        if (syn.tipo) {
          sinergias.push({
            ingredientes: [syn.ingredienteA, syn.ingredienteB].filter(Boolean),
            tipo: syn.tipo,
            beneficio: this.getSynergyBenefit(syn.tipo),
          });
        }
      });
    }

    return sinergias;
  }

  /**
   * Obtener beneficio según tipo de sinergia
   */
  private getSynergyBenefit(tipo: string): string {
    const beneficios: Record<string, string> = {
      potenciador: 'Aumenta la efectividad de ambos compuestos',
      complementario: 'Ambos trabajan en la misma vía metabólica',
      cofactor: 'Uno ayuda a la absorción del otro',
      secuencial: 'Se complementan en diferentes fases del proceso',
      bioactivador: 'Activa mecanismos de acción cruzada',
    };
    return beneficios[tipo] || 'Sinergia beneficiosa';
  }

  /**
   * Recopilar advertencias y contraindicaciones
   */
  private gatherWarnings(ingredientes: ProtocolIngredient[]): {
    advertencias: string[];
    contraindicaciones: string[];
  } {
    const advertencias: string[] = [];
    const contraindicaciones: string[] = [];

    // Añadir advertencias comunes según categoría
    const categorias = [...new Set(ingredientes.map(i => i.categoria))];
    
    if (categorias.includes('fitoterapia')) {
      advertencias.push('Las plantas medicinales pueden interactuar con medicamentos');
    }
    if (categorias.includes('homeopatia')) {
      advertencias.push('Evitar cafeína y mentol durante el tratamiento homeopático');
    }

    return { advertencias, contraindicaciones };
  }

  /**
   * Sugerir duración del protocolo
   */
  private suggestDuration(objetivoId: string): string {
    const duraciones: Record<string, string> = {
      sueno: '4-8 semanas',
      inmuniddad: '2-3 meses',
      energia: '4-6 semanas',
      stress: '6-8 semanas',
      articulaciones: '3-6 meses',
      cognicion: '3-6 meses',
      digestion: '4-8 semanas',
      cardiovascular: '6-12 meses',
    };
    return duraciones[objetivoId] || '4-6 semanas';
  }

  /**
   * Sugerir dosis según ingrediente
   */
  private suggestDosage(ingredient: any): string {
    // Usar información de la KB si está disponible
    if (ingredient.dosisDiaria) {
      return ingredient.dosisDiaria;
    }
    if (ingredient.dilucionRecomendada) {
      return ingredient.dilucionRecomendada;
    }
    
    // Valores por defecto según categoría
    const defaultDoses: Record<string, string> = {
      vitaminas: '1 cápsula/día',
      minerales: '1 cápsula/día',
      fitoterapia: 'según prospecto',
      probioticos: '1-2 cápsulas/día',
      aminoacidos: '1-2g/día',
    };
    
    return defaultDoses[ingredient.categoria] || 'según indicación profesional';
  }

  /**
   * Verificar compatibilidad de ingredientes
   */
  checkCompatibility(ingredientIds: string[]): {
    sinergias: any[];
    antagonismos: any[];
  } {
    return {
      sinergias: synergyEngineV2.analyze(ingredientIds).sinergiasDetectadas || [],
      antagonismos: synergyEngineV2.checkAntagonisms(ingredientIds),
    };
  }
}

// Exportar singleton
export const protocolService = ProtocolService.getInstance();
