/**
 * SyncService - Servicio de sincronización con Supabase
 * Maneja la sincronización de ingredientes, productos y alertas de seguridad
 */

import { useSyncStore, type SecurityAlert, type SyncIngredientData, type SyncProductData } from './sync-store';
import { INGREDIENT_DATABASE } from '../ingredient-database/ingredients';

// Configuración de Supabase
// NOTA: Reemplazar con tus credenciales reales
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';
const SYNC_INTERVAL = 30 * 60 * 1000; // 30 minutos

export interface SyncConfig {
  autoSync: boolean;
  syncOnMount: boolean;
  syncInterval: number;
  enableAlerts: boolean;
}

const defaultConfig: SyncConfig = {
  autoSync: true,
  syncOnMount: true,
  syncInterval: SYNC_INTERVAL,
  enableAlerts: true,
};

class SyncService {
  private config: SyncConfig = defaultConfig;
  private syncTimer: number | null = null;
  private isRunning = false;

  /**
   * Inicializar el servicio de sincronización
   */
  init(config: Partial<SyncConfig> = {}) {
    this.config = { ...defaultConfig, ...config };

    if (this.config.syncOnMount) {
      this.syncOnMount();
    }

    if (this.config.autoSync) {
      this.startAutoSync();
    }

    // Limpiar alertas expiradas al iniciar
    useSyncStore.getState().clearExpiredAlerts();
  }

  /**
   * Detener el servicio
   */
  stop() {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }
    this.isRunning = false;
  }

  /**
   * Sincronización al montar la aplicación
   */
  private async syncOnMount() {
    const store = useSyncStore.getState();
    
    // Verificar si necesitamos sincronizar
    const needsSync = this.needsSync();
    
    if (needsSync && store.isOnline) {
      await this.syncAll();
    }
  }

  /**
   * Iniciar sincronización automática
   */
  startAutoSync() {
    if (this.syncTimer) return;
    
    this.syncTimer = window.setInterval(() => {
      if (useSyncStore.getState().isOnline) {
        this.syncAll();
      }
    }, this.config.syncInterval);

    this.isRunning = true;
  }

  /**
   * Verificar si necesita sincronización
   */
  private needsSync(): boolean {
    const { ingredientsLastSync, productsLastSync } = useSyncStore.getState();
    
    if (!ingredientsLastSync || !productsLastSync) return true;
    
    const now = Date.now();
    const thirtyMinutes = 30 * 60 * 1000;
    
    return (
      now - new Date(ingredientsLastSync).getTime() > thirtyMinutes ||
      now - new Date(productsLastSync).getTime() > thirtyMinutes
    );
  }

  /**
   * Sincronizar todo
   */
  async syncAll(): Promise<{ success: boolean; error?: string }> {
    const store = useSyncStore.getState();
    
    if (!store.isOnline) {
      return { success: false, error: 'Sin conexión a internet' };
    }

    store.setSyncing(true);
    store.setError(null);

    try {
      // Sincronizar en paralelo
      await Promise.all([
        this.syncIngredients(),
        this.syncProducts(),
        this.syncAlerts(),
      ]);

      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error de sincronización';
      store.setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      store.setSyncing(false);
    }
  }

  /**
   * Sincronizar ingredientes desde Supabase
   */
  async syncIngredients(): Promise<void> {
    // Si Supabase no está configurado, usar datos locales
    if (!this.isSupabaseConfigured()) {
      console.log('[Sync] Usando base de datos local de ingredientes');
      this.loadLocalIngredients();
      return;
    }

    try {
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/ingredients?select=*&order=name.asc`,
        {
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Error fetching ingredients: ${response.status}`);
      }

      const data = await response.json();
      
      // Convertir a formato del store
      const ingredients: Record<string, SyncIngredientData> = {};
      for (const item of data) {
        ingredients[item.id] = {
          id: item.id,
          name: item.name,
          scientificName: item.scientific_name,
          category: item.category,
          description: item.description,
          mechanism: item.mechanism,
          indications: item.indications || [],
          contraindications: item.contraindications || [],
          interactions: item.interactions || [],
          dosage: item.dosage,
          sideEffects: item.side_effects || [],
          synonyms: item.synonyms || [],
          warnings: item.warnings || [],
          lastUpdated: item.updated_at,
        };
      }

      useSyncStore.getState().setIngredients(ingredients);
    } catch (error) {
      console.error('[Sync] Error sincronizando ingredientes:', error);
      // Caer a datos locales
      this.loadLocalIngredients();
    }
  }

  /**
   * Cargar ingredientes desde base de datos local
   */
  private loadLocalIngredients() {
    const ingredients: Record<string, SyncIngredientData> = {};
    
    for (const [key, ing] of Object.entries(INGREDIENT_DATABASE)) {
      ingredients[key] = {
        id: ing.id,
        name: ing.name,
        scientificName: ing.scientificName,
        category: ing.category,
        description: ing.description,
        mechanism: ing.mechanism,
        indications: ing.indications,
        contraindications: ing.contraindications,
        interactions: ing.interactions,
        dosage: ing.dosage,
        sideEffects: ing.sideEffects,
        synonyms: ing.synonyms,
        warnings: ing.warnings,
        lastUpdated: new Date().toISOString(),
      };
    }

    useSyncStore.getState().setIngredients(ingredients);
  }

  /**
   * Sincronizar productos desde Supabase
   */
  async syncProducts(): Promise<void> {
    if (!this.isSupabaseConfigured()) {
      console.log('[Sync] Supabase no configurado, omitiendo productos');
      return;
    }

    try {
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/products?select=sku,description,indications,posologia,contraindications,interactions,side_effects,updated_at`,
        {
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Error fetching products: ${response.status}`);
      }

      const data = await response.json();
      
      const productsData: Record<string, SyncProductData> = {};
      for (const item of data) {
        productsData[item.sku] = {
          sku: item.sku,
          description: item.description,
          indications: item.indications,
          posologia: item.posologia,
          contraindications: item.contraindications,
          interactions: item.interactions,
          sideEffects: item.side_effects,
          lastUpdated: item.updated_at,
        };
      }

      useSyncStore.getState().setProductsData(productsData);
    } catch (error) {
      console.error('[Sync] Error sincronizando productos:', error);
    }
  }

  /**
   * Sincronizar alertas de seguridad
   */
  async syncAlerts(): Promise<void> {
    if (!this.config.enableAlerts) return;

    // Alertas locales predefinidas (siempre disponibles)
    const localAlerts = this.getLocalAlerts();

    // Si Supabase está configurado, buscar alertas remotas
    if (this.isSupabaseConfigured()) {
      try {
        const response = await fetch(
          `${SUPABASE_URL}/rest/v1/security_alerts?select=*&order=created_at.desc&active.eq.true`,
          {
            headers: {
              'apikey': SUPABASE_ANON_KEY,
              'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            },
          }
        );

        if (response.ok) {
          const remoteAlerts = await response.json();
          
          // Combinar alertas locales y remotas
          const allAlerts = [...remoteAlerts, ...localAlerts];
          useSyncStore.getState().setAlerts(allAlerts);
          return;
        }
      } catch (error) {
        console.error('[Sync] Error sincronizando alertas:', error);
      }
    }

    // Usar solo alertas locales
    useSyncStore.getState().setAlerts(localAlerts);
  }

  /**
   * Obtener alertas locales predefinidas
   */
  private getLocalAlerts(): SecurityAlert[] {
    const now = new Date();
    const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    return [
      {
        id: 'alert-001',
        type: 'contraindication',
        title: 'Interacción: AINEs y Anticoagulantes',
        message: 'Precaución con el uso simultáneo de antiinflamatorios y anticoagulantes. Puede aumentar el riesgo de sangrado.',
        affectedIngredients: ['ibuprofeno', 'aspirina', 'naproxeno'],
        severity: 'high',
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
        read: false,
        expiresAt: nextMonth.toISOString(),
        source: 'Vademecum AI',
      },
      {
        id: 'alert-002',
        type: 'warning',
        title: 'Valeriana y Somnolencia',
        message: 'La valeriana puede causar somnolencia. No conducir o manejar maquinaria pesada después de tomarla.',
        affectedIngredients: ['valeriana'],
        severity: 'medium',
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
        read: false,
        expiresAt: nextMonth.toISOString(),
        source: 'Vademecum AI',
      },
      {
        id: 'alert-003',
        type: 'warning',
        title: '5-HTP y Antidepresivos',
        message: '⚠️ NO combinar 5-HTP con ISRS, IMAOs u otros serotonérgicos. Riesgo de síndrome serotoninérgico.',
        affectedIngredients: ['5-htp'],
        severity: 'critical',
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
        read: false,
        expiresAt: nextMonth.toISOString(),
        source: 'Vademecum AI',
      },
      {
        id: 'alert-004',
        type: 'warning',
        title: 'Ginseng y Presión Arterial',
        message: 'El ginseng puede afectar la presión arterial. Precaución en personas con hipertensión.',
        affectedIngredients: ['ginseng'],
        severity: 'medium',
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
        read: false,
        expiresAt: nextMonth.toISOString(),
        source: 'Vademecum AI',
      },
      {
        id: 'alert-005',
        type: 'warning',
        title: 'Omega-3 y Anticoagulantes',
        message: 'Los omega-3 pueden potenciar el efecto de anticoagulantes. Consultar médico.',
        affectedIngredients: ['omega-3'],
        severity: 'medium',
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
        read: false,
        expiresAt: nextMonth.toISOString(),
        source: 'Vademecum AI',
      },
      {
        id: 'alert-006',
        type: 'contraindication',
        title: 'Vitamina D y Hipercalcemia',
        message: 'No usar vitamina D en caso de hipercalcemia o hiperparatiroidismo. Controlar niveles regularmente.',
        affectedIngredients: ['vitamina-d'],
        severity: 'high',
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
        read: false,
        expiresAt: nextMonth.toISOString(),
        source: 'Vademecum AI',
      },
    ];
  }

  /**
   * Verificar alertas para un producto o ingrediente específico
   */
  getAlertsForItem(itemName: string): SecurityAlert[] {
    const { alerts } = useSyncStore.getState();
    const itemLower = itemName.toLowerCase();

    return alerts.filter(alert => {
      // Verificar si afecta al producto/ingrediente
      if (alert.affectedIngredients) {
        return alert.affectedIngredients.some(ing => 
          itemLower.includes(ing.toLowerCase())
        );
      }
      if (alert.affectedProducts) {
        return alert.affectedProducts.some(prod => 
          itemLower.includes(prod.toLowerCase())
        );
      }
      return false;
    });
  }

  /**
   * Verificar si Supabase está configurado
   */
  private isSupabaseConfigured(): boolean {
    return (
      SUPABASE_URL !== 'https://your-project.supabase.co' &&
      SUPABASE_ANON_KEY !== 'your-anon-key'
    );
  }

  /**
   * Obtener estado del servicio
   */
  getStatus() {
    const store = useSyncStore.getState();
    return {
      isRunning: this.isRunning,
      isOnline: store.isOnline,
      isSyncing: store.isSyncing,
      lastSync: {
        ingredients: store.ingredientsLastSync,
        products: store.productsLastSync,
      },
      itemsCount: {
        alerts: store.alerts.length,
        unreadAlerts: store.unreadAlertsCount,
        ingredients: Object.keys(store.ingredients).length,
      },
    };
  }
}

// Instancia singleton
export const syncService = new SyncService();

export default syncService;
