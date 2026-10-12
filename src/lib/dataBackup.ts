/**
 * dataBackup - Utilidades de Exportación e Importación de datos Offline.
 * 
 * Permite al farmacéutico realizar copias de seguridad portátiles en formato JSON
 * (favoritos, protocolos personalizados, notas, sinergias añadidas)
 * y restaurarlas de forma 100% local sin servidores.
 */

import { db } from '@/db';
import { logger } from '@/lib/logger';

export interface VademecumBackupData {
  version: number;
  exportedAt: string;
  app: string;
  favorites: Array<{ id: string; ingredientId: string; createdAt: number }>;
  protocols: unknown[];
  customIngredients: unknown[];
  customSynergies: unknown[];
}

/**
 * Exporta todos los datos generados por el usuario a un archivo JSON descargable.
 */
export async function exportUserData(): Promise<VademecumBackupData> {
  const [favorites, protocols, ingredients, synergies] = await Promise.all([
    db.favorites.toArray(),
    db.protocols.where('tombstone').equals(0).toArray(),
    db.ingredients.where('deviceId').notEqual('seeder').and((i) => i.deviceId !== 'local' && i.tombstone === 0).toArray(),
    db.synergies.where('tombstone').equals(0).and((s) => s.deviceId !== 'seeder' && s.deviceId !== 'local').toArray(),
  ]);

  const backup: VademecumBackupData = {
    version: 1,
    exportedAt: new Date().toISOString(),
    app: 'Vademecum AI',
    favorites,
    protocols,
    customIngredients: ingredients,
    customSynergies: synergies,
  };

  return backup;
}

/**
 * Descarga el archivo de backup en el navegador.
 */
export async function downloadUserDataBackup(): Promise<void> {
  const backup = await exportUserData();
  const jsonStr = JSON.stringify(backup, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `vademecum-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Restaura los datos desde un objeto JSON previamente exportado.
 */
export async function importUserData(backup: VademecumBackupData): Promise<{
  favoritesCount: number;
  protocolsCount: number;
}> {
  if (!backup || backup.app !== 'Vademecum AI') {
    throw new Error('Archivo de copia de seguridad no válido o incompatible.');
  }

  let favoritesCount = 0;
  let protocolsCount = 0;

  if (Array.isArray(backup.favorites) && backup.favorites.length > 0) {
    await db.favorites.bulkPut(backup.favorites);
    favoritesCount = backup.favorites.length;
  }

  if (Array.isArray(backup.protocols) && backup.protocols.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await db.protocols.bulkPut(backup.protocols as any[]);
    protocolsCount = backup.protocols.length;
  }

  logger.info(`[Backup] Restauración completada: ${favoritesCount} favoritos, ${protocolsCount} protocolos.`);
  return { favoritesCount, protocolsCount };
}
