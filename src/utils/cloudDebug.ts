import { cloudSyncService } from '../services/CloudSyncService';

export const verifyCloudBackup = async () => {
  console.log('[CloudDebug] Iniciando verificación de respaldo en la nube...');
  try {
    const hasData = await cloudSyncService.checkCloudData();
    const count = await cloudSyncService.getCloudCount();
    
    console.log(`[CloudDebug] ¡Verificación exitosa!`);
    console.log(`[CloudDebug] ¿Tiene datos en la nube?: ${hasData}`);
    console.log(`[CloudDebug] Cantidad de productos en la nube: ${count}`);
  } catch (error) {
    console.error('[CloudDebug] Error durante la verificación:', error);
  }
};
