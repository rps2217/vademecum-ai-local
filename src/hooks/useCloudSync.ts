import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { cloudSyncService } from '../services/CloudSyncService';

export const useCloudSync = () => {
  const { user, isAdmin } = useAuth();
  const [isSyncing, setIsSyncing] = useState(false);
  const [cloudHasData, setCloudHasData] = useState<boolean | null>(null);

  useEffect(() => {
    if (user) {
      cloudSyncService.checkCloudData().then(setCloudHasData);
    }
  }, [user]);

  const handleSync = async () => {
    if (!isAdmin) return;
    setIsSyncing(true);
    try {
      const count = await cloudSyncService.uploadLocalProducts();
      setCloudHasData(true);
      return count;
    } catch (error) {
      console.error("Error syncing:", error);
      throw error;
    } finally {
      setIsSyncing(false);
    }
  };

  return {
    isSyncing,
    cloudHasData,
    handleSync,
    isAdmin
  };
};
