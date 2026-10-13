import { DbProduct, DbPathology } from '@/db/schema';

export interface PatientProfile {
  patologias: string[];
  restricciones: {
    hipertension?: boolean;
    diabetes?: boolean;
    embarazo?: boolean;
    celiaco?: boolean;
  };
}

export class RecommendationEngine {
  async getRecommendations(
    profile: PatientProfile,
    pathology: DbPathology,
    products: DbProduct[]
  ): Promise<DbProduct[]> {
    // 1. Filtrado de seguridad (Hard Filters)
    let filtered = products.filter((p) => {
      if (profile.restricciones.hipertension && p.hipertension === 'evitar') return false;
      if (profile.restricciones.diabetes && p.diabetes === 'evitar') return false;
      if (profile.restricciones.embarazo && (p.embarazo === 'contraindicado' || p.embarazo === 'evitar')) return false;
      if (profile.restricciones.celiaco && p.celiacos === 'evitar') return false;
      return true;
    });

    // 2. Ranking (Soft Sorting)
    filtered.sort((a, b) => {
      let scoreA = 0;
      let scoreB = 0;

      // Coincidencia con patología (indicaciones)
      if (a.indicaciones.some(ind => pathology.nombre.toLowerCase().includes(ind.toLowerCase()))) scoreA += 10;
      if (b.indicaciones.some(ind => pathology.nombre.toLowerCase().includes(ind.toLowerCase()))) scoreB += 10;

      // Preferencia por fitoterapia si es una patología crónica
      if (a.categoria === 'fitoterapia' || a.categoria === 'homeopatia') scoreA += 5;
      if (b.categoria === 'fitoterapia' || b.categoria === 'homeopatia') scoreB += 5;

      return scoreB - scoreA;
    });

    return filtered;
  }
}

export const recommendationEngine = new RecommendationEngine();
