import { getDB } from '../core/database/db';
import { Product } from '../core/types/product.types';

export class DataService {
  static async importProducts(jsonString: string): Promise<{ success: number; errors: number }> {
    try {
      const data = JSON.parse(jsonString);
      const products: Product[] = Array.isArray(data) ? data : [data];
      
      const db = await getDB();
      let success = 0;
      let errors = 0;

      for (const p of products) {
        try {
          // Asegurar que tenga los campos mínimos
          if (!p.nombre_comercial || !p.sku) {
            errors++;
            continue;
          }

          // Si viene de un script externo, puede que le falten campos de la app
          const normalizedProduct: Product = {
            ...p,
            vectores: p.vectores || [],
            skus_relacionados: p.skus_relacionados || [],
            sugerencia_complementaria: p.sugerencia_complementaria || "",
            synergy_analyzed: p.synergy_analyzed ?? false,
            tags_ia: p.tags_ia || []
          };

          await db.put('products', normalizedProduct);
          success++;
        } catch (e) {
          errors++;
        }
      }

      window.dispatchEvent(new CustomEvent('db_updated'));
      return { success, errors };
    } catch (e) {
      console.error('[DataService] Error parsing JSON:', e);
      throw new Error('El archivo JSON no es válido.');
    }
  }

  static async exportProducts(): Promise<string> {
    const db = await getDB();
    const all = await db.getAll('products');
    return JSON.stringify(all, null, 2);
  }
}
