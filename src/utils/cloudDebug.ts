import { cloudSyncService } from '../services/CloudSyncService';

export const verifyCloudBackup = async () => {
  try {
    const hasData = await cloudSyncService.checkCloudData();
    const count = await cloudSyncService.getCloudCount();
    
  } catch (error) {
    console.error('[CloudDebug] Error durante la verificación:', error);
  }
};
