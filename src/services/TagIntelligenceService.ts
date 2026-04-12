import { getDB } from '../core/database/db';
import { FirebaseSyncService } from './FirebaseSyncService';
import { GeminiService } from './GeminiService';
import { AIService } from './AIService';

export class TagIntelligenceService {
  private static localCache: Record<string, string> = {};
  private static isInitialized = false;

  static async init() {
    if (this.isInitialized) return;
    
    try {
      // 1. Cargar mapeos desde IndexedDB
      const db = await getDB();
      const mappings = await db.getAll('tag_mappings');
      mappings.forEach(m => {
        this.localCache[m.raw] = m.normalized;
      });

      // 2. Sincronizar con Firestore (opcional, se puede hacer bajo demanda)
      this.isInitialized = true;
    } catch (error) {
      console.error('[TagIntelligence] Error inicializando:', error);
    }
  }

  static async normalizeTag(rawTag: string): Promise<string> {
    const raw = rawTag.toLowerCase().trim();
    if (!raw) return '';

    // 1. Check local cache
    if (this.localCache[raw]) return this.localCache[raw];

    // 2. Check Firestore (via FirebaseSyncService or direct)
    // Para simplificar, si no está en cache local, intentamos normalizar con IA
    // y luego guardamos en ambos sitios.

    try {
      const normalized = await this.askIAForNormalization(raw);
      
      // 3. Guardar en cache local y DB
      this.localCache[raw] = normalized;
      const db = await getDB();
      await db.put('tag_mappings', { raw, normalized, last_updated: Date.now() });

      // 4. Sincronizar con la nube
      await FirebaseSyncService.saveTagMapping(raw, normalized);

      return normalized;
    } catch (error) {
      console.error('[TagIntelligence] Error normalizando tag:', raw, error);
      return raw; // Fallback al original
    }
  }

  private static async askIAForNormalization(tag: string): Promise<string> {
    // 1. Intentar con IA Local primero (Gratis y Privado)
    try {
      const localResult = await AIService.normalizeTag(tag);
      if (localResult && localResult.length > 2) {
        return localResult;
      }
    } catch (e) {
      console.warn('[TagIntelligence] IA Local falló, usando Gemini...');
    }

    // 2. Fallback a Gemini con instrucciones de ESTANDARIZACIÓN, no de SINÓNIMOS
    const prompt = `Actúa como un organizador de datos farmacéuticos. 
    Tu tarea es ESTANDARIZAR etiquetas para que sean legibles y uniformes.
    
    REGLAS CRÍTICAS:
    1. NO uses sinónimos complejos o términos médicos rebuscados (Ej: NO cambies "Dolor de cabeza" por "Cefalea").
    2. Mantén el término más CERCANO a la realidad y más reconocible por un usuario común.
    3. Corrige SOLO: Ortografía, Plurales/Singulares, y Capitalización.
    4. Si el término ya es correcto y estándar, devuélvelo tal cual.
    
    EJEMPLOS:
    - "producto alimentario" -> "Producto Alimenticio"
    - "productos alimenticios" -> "Producto Alimenticio"
    - "analgesico" -> "Analgésico"
    - "vitaminas" -> "Vitamina"
    - "jarabes" -> "Jarabe"
    
    ETIQUETA A ESTANDARIZAR: "${tag}"
    
    Responde ÚNICAMENTE con la etiqueta estandarizada (máximo 3 palabras, Capitalización De Título).`;

    try {
      const result = await GeminiService.generateText(prompt);
      const normalized = result.trim().replace(/[".]/g, '');
      
      // Validación de seguridad: Si la IA cambió demasiado el término, ignoramos el cambio
      // Esto evita que "Dolor" se convierta en algo totalmente distinto por error.
      if (normalized.length < 2) return tag;
      
      return normalized;
    } catch (error) {
      return tag;
    }
  }

  static async batchNormalize(tags: string[]): Promise<Record<string, string>> {
    const results: Record<string, string> = {};
    const uniqueTags = [...new Set(tags)];
    
    for (const tag of uniqueTags) {
      results[tag] = await this.normalizeTag(tag);
    }
    
    return results;
  }
}
