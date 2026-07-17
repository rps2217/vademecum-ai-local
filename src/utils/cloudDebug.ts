import { logger } from '../services/LoggerService';
import { cloudSyncService } from '../services/CloudSyncService';

export const verifyCloudBackup = async () => {
  logger.info('[CloudDebug] Iniciando verificación de respaldo en la nube...');
  try {
    const hasData = await cloudSyncService.checkCloudData();
    const count = await cloudSyncService.getCloudCount();
    
    logger.info(`[CloudDebug] ¡Verificación exitosa!`);
    logger.info(`[CloudDebug] ¿Tiene datos en la nube?: ${hasData}`);
    logger.info(`[CloudDebug] Cantidad de productos en la nube: ${count}`);
  } catch (error) {
    logger.error('[CloudDebug] Error durante la verificación:', error);
  }
};
