import { supabaseService } from './SupabaseService';
import { aiService } from './AIService';
import { logger } from './LoggerService';

export interface ClinicalInsight {
    principle: string;
    mechanism: string;
    interactions: string;
    similarity: number;
}

export class MedicalRAGService {
    private static instance: MedicalRAGService;

    private constructor() {}

    static getInstance(): MedicalRAGService {
        if (!MedicalRAGService.instance) {
            MedicalRAGService.instance = new MedicalRAGService();
        }
        return MedicalRAGService.instance;
    }

    /**
     * Recupera información clínica relevante desde Supabase pgvector
     * basándose en los principios activos proporcionados.
     */
    async retrieveClinicalContext(principles: string[]): Promise<ClinicalInsight[]> {
        if (!principles || principles.length === 0) return [];

        const supabase = supabaseService.getClient();
        const insights: ClinicalInsight[] = [];

        for (const principle of principles) {
            try {
                // 1. Generar embedding para el principio activo
                // (Usamos el motor local de AIService para mantener consistencia)
                const embedding = await aiService.generateEmbedding(principle);
                
                // Verificar si el embedding es válido (no todo ceros)
                if (embedding.every(v => v === 0)) {
                    logger.warn(`No se pudo generar embedding para RAG: ${principle}`, 'RAG');
                    continue;
                }

                // 2. Llamada RPC a Supabase para búsqueda por similitud
                // Esta función 'match_clinical_knowledge' debe estar definida en la DB
                const { data, error } = await supabase.rpc('match_clinical_knowledge', {
                    query_embedding: embedding,
                    match_threshold: 0.75,
                    match_count: 3,
                });

                if (error) {
                    logger.error(`Error en búsqueda vectorial para ${principle}`, 'RAG', error);
                    continue;
                }

                if (data && data.length > 0) {
                    data.forEach((match: any) => {
                        insights.push({
                            principle: match.principle_name || principle,
                            mechanism: match.mechanism_of_action,
                            interactions: match.interaction_notes,
                            similarity: match.similarity
                        });
                    });
                }
            } catch (err) {
                logger.error(`Fallo crítico en RAG para ${principle}`, 'RAG', err);
            }
        }

        // Eliminar duplicados cercanos si los hay y devolver
        return insights;
    }

    /**
     * Contribuye a la base de conocimientos clínicos en Supabase.
     */
    async upsertClinicalKnowledge(principle: string, mechanism: string): Promise<boolean> {
        try {
            const supabase = supabaseService.getClient();
            const embedding = await aiService.generateEmbedding(mechanism); // Vectorizamos el mecanismo

            const { error } = await supabase.from('clinical_knowledge').upsert({
                principle_name: principle,
                mechanism_of_action: mechanism,
                embedding: embedding,
                last_updated: new Date().toISOString()
            }, { onConflict: 'principle_name' });

            if (error) {
                logger.error(`Error al persistir conocimiento RAG para ${principle}`, 'RAG', error);
                return false;
            }
            return true;
        } catch (err) {
            logger.error(`Excepción al contribuir a RAG para ${principle}`, 'RAG', err);
            return false;
        }
    }

    /**
     * Formatea los insights para ser inyectados en un prompt de LLM.
     */
    formatInsightsForPrompt(insights: ClinicalInsight[]): string {
        if (insights.length === 0) return "No se encontró información específica en la base de conocimientos clínicos.";

        return insights.map(i => 
            `INSIGHT CLÍNICO (${i.principle}):\n` +
            `- Mecanismo: ${i.mechanism}\n` +
            `- Interacciones conocidas: ${i.interactions}`
        ).join('\n\n');
    }
}

export const medicalRAGService = MedicalRAGService.getInstance();
