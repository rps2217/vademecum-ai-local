import { supabaseService } from './SupabaseService';
import { aiService } from './AIService';
import { logger } from './LoggerService';
import { semanticSearchService } from './SemanticSearchService';
import { thermalGuardService } from './ThermalGuardService';

export interface ClinicalInsight {
    principle: string;
    mechanism: string;
    interactions: string;
    similarity: number;
    source: 'local' | 'cloud';
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

    async retrieveClinicalContext(principles: string[]): Promise<ClinicalInsight[]> {
        if (!principles || principles.length === 0) return [];
        
        if (thermalGuardService.shouldPauseHeavyTask()) {
            logger.info('Carga alta, limitando RAG a solo búsqueda local rápida', 'RAG');
            return this.queryLocalOnly(principles);
        }

        return this.queryHybrid(principles);
    }

    private async queryLocalOnly(principles: string[]): Promise<ClinicalInsight[]> {
        const insights: ClinicalInsight[] = [];
        for (const p of principles) {
            const results = await semanticSearchService.semanticSearch(p, 2);
            results.forEach(r => {
                insights.push({
                    principle: p,
                    mechanism: r.product.sugerencia_complementaria || 'Sin información local',
                    interactions: r.product.skus_relacionados ? 'Ver conexiones locales' : 'Sin interacciones',
                    similarity: r.score,
                    source: 'local'
                });
            });
        }
        return insights;
    }

    private async queryHybrid(principles: string[]): Promise<ClinicalInsight[]> {
        const local = await this.queryLocalOnly(principles);
        const cloud: ClinicalInsight[] = [];

        const supabase = supabaseService.getClient();

        for (const principle of principles) {
            try {
                const embedding = await aiService.generateEmbedding(principle);
                if (embedding.every(v => v === 0)) continue;

                const { data, error } = await supabase.rpc('match_clinical_knowledge', {
                    query_embedding: embedding,
                    match_threshold: 0.75,
                    match_count: 2,
                });

                if (!error && data) {
                    data.forEach((match: any) => {
                        cloud.push({
                            principle: match.principle_name || principle,
                            mechanism: match.mechanism_of_action,
                            interactions: match.interaction_notes,
                            similarity: match.similarity,
                            source: 'cloud'
                        });
                    });
                }
            } catch (err) {
                logger.error(`Error RAG Cloud para ${principle}`, 'RAG', err);
            }
        }

        return [...local, ...cloud].sort((a, b) => b.similarity - a.similarity);
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
            `INSIGHT CLÍNICO (${i.principle} - Fuente: ${i.source.toUpperCase()}):\n` +
            `- Mecanismo: ${i.mechanism}\n` +
            `- Interacciones conocidas: ${i.interactions}`
        ).join('\n\n');
    }
}

export const medicalRAGService = MedicalRAGService.getInstance();
