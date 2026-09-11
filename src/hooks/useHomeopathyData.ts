/**
 * Hook para gestionar datos de Homeopatía en el Dashboard
 */

import { useMemo } from 'react';
import type { HomeopathicRemedyData } from '@/types/homeopathy';
import homeopatiaRaw from '@/db/seeders/data/homeopatia.json';
import { normalize } from '@/lib/text';

interface UseHomeopathyOptions {
  query?: string;
  system?: string;
  indication?: string;
  worseWith?: string;
  betterWith?: string;
  evidence?: string;
}

export function useHomeopathyData(options: UseHomeopathyOptions = {}) {
  const { query = '', system = '', indication = '', worseWith = '', betterWith = '', evidence = '' } = options;

  const remedies = useMemo<HomeopathicRemedyData[]>(() => {
    return (homeopatiaRaw.ingredientes as unknown as HomeopathicRemedyData[]) || [];
  }, []);

  // Estadísticas globales
  const stats = useMemo(() => {
    const total = remedies.length;
    const systemsMap: Record<string, number> = {};
    const indicationsSet = new Set<string>();
    const modalitiesWorseSet = new Set<string>();
    const modalitiesBetterSet = new Set<string>();

    remedies.forEach((r) => {
      r.sistemas?.forEach((s) => {
        systemsMap[s] = (systemsMap[s] || 0) + 1;
      });
      r.indicaciones?.forEach((ind) => indicationsSet.add(ind));
      r.modalidades?.empeora?.forEach((m) => modalitiesWorseSet.add(m.toLowerCase().trim()));
      r.modalidades?.mejora?.forEach((m) => modalitiesBetterSet.add(m.toLowerCase().trim()));
    });

    return {
      total,
      systemsCount: Object.keys(systemsMap).length,
      systemsMap,
      indicationsCount: indicationsSet.size,
      topIndications: Array.from(indicationsSet).sort(),
      modalitiesWorse: Array.from(modalitiesWorseSet).filter(m => m.length > 2).sort(),
      modalitiesBetter: Array.from(modalitiesBetterSet).filter(m => m.length > 2).sort(),
    };
  }, [remedies]);

  // Filtrado reactivo de repertorización
  const filteredRemedies = useMemo(() => {
    const qNorm = normalize(query.trim());
    const sysNorm = system.trim().toLowerCase();
    const indNorm = indication.trim().toLowerCase();
    const worseNorm = worseWith.trim().toLowerCase();
    const betterNorm = betterWith.trim().toLowerCase();
    const evNorm = evidence.trim().toUpperCase();

    return remedies.filter((r) => {
      // 1. Filtro por texto libre
      if (qNorm) {
        const nameMatch = normalize(r.nombre).includes(qNorm);
        const altMatch = r.nombresAlternativos?.some((alt) => normalize(alt).includes(qNorm));
        const sciMatch = r.nombreCientifico ? normalize(r.nombreCientifico).includes(qNorm) : false;
        const descMatch = normalize(r.descripcion || '').includes(qNorm);
        const keynotesMatch = r.sintomasClave?.some((k) => normalize(k).includes(qNorm));
        const indMatch = r.indicaciones?.some((ind) => normalize(ind).includes(qNorm));
        const modMatch = [
          ...(r.modalidades?.empeora || []),
          ...(r.modalidades?.mejora || []),
        ].some((m) => normalize(m).includes(qNorm));

        if (!nameMatch && !altMatch && !sciMatch && !descMatch && !keynotesMatch && !indMatch && !modMatch) {
          return false;
        }
      }

      // 2. Filtro por sistema
      if (sysNorm && !r.sistemas?.some((s) => s.toLowerCase() === sysNorm)) {
        return false;
      }

      // 3. Filtro por indicación
      if (indNorm && !r.indicaciones?.some((ind) => ind.toLowerCase() === indNorm)) {
        return false;
      }

      // 4. Modalidad Empeora
      if (worseNorm && !r.modalidades?.empeora?.some((m) => m.toLowerCase().includes(worseNorm))) {
        return false;
      }

      // 5. Modalidad Mejora
      if (betterNorm && !r.modalidades?.mejora?.some((m) => m.toLowerCase().includes(betterNorm))) {
        return false;
      }

      // 6. Evidencia
      if (evNorm && r.nivelEvidencia !== evNorm) {
        return false;
      }

      return true;
    });
  }, [remedies, query, system, indication, worseWith, betterWith, evidence]);

  return {
    remedies,
    filteredRemedies,
    stats,
    total: remedies.length,
    filteredCount: filteredRemedies.length,
  };
}
