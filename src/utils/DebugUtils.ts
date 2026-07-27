/**
 * Utilidades de Debug y Migración
 * 
 * Estas funciones están expuestas globalmente para ser llamadas desde la consola del navegador.
 * Útiles para diagnóstico y migración de datos.
 */

import { dataService } from '../services/DataService';
import { cloudSyncService } from '../services/CloudSyncService';
import { productsCollection } from '../database';
import { logger } from '../services/LoggerService';
import { Q } from '@nozomuikuta/h3-validations';

/**
 * Objeto global con utilidades de debug
 */
(window as any).DebugTools = {
  /**
   * Exporta todos los productos locales a JSON
   * Copia el resultado al portapapeles
   */
  async exportProducts() {
    try {
      logger.info(('📤 Exportando productos...');
      const json = await dataService.exportToJSON();
      
      // Copiar al portapapeles
      await navigator.clipboard.writeText(json);
      logger.info((`✅ Exportados ${JSON.parse(json).length} productos al portapapeles`);
      
      // También guardar en localStorage como backup
      localStorage.setItem('vademecum_export_backup', json);
      logger.info(('💾 Backup guardado en localStorage');
      
      return json;
    } catch (error) {
      logger.error('❌ Error exportando:', error, 'DebugUtils');
      throw error;
    }
  },

  /**
   * Descarga los productos como archivo JSON
   */
  async downloadProducts() {
    try {
      logger.info(('📥 Descargando productos como archivo...');
      const json = await dataService.exportToJSON();
      const products = JSON.parse(json);
      
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `vademecum_products_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      logger.info((`✅ Descargados ${products.length} productos`);
      return products.length;
    } catch (error) {
      logger.error('❌ Error descargando:', error, 'DebugUtils');
      throw error;
    }
  },

  /**
   * Sube todos los productos locales a Supabase
   * Útil para respaldar datos en la nube
   */
  async backupToCloud() {
    try {
      logger.info(('☁️ Iniciando backup a la nube...');
      const result = await dataService.backupToCloud();
      
      if (result.success) {
        logger.info((`✅ Backup completado: ${result.count} productos`);
      } else {
        logger.error(`❌ Error en backup: ${result.error}`, 'DebugUtils');
      }
      
      return result;
    } catch (error) {
      logger.error('❌ Error en backup:', error, 'DebugUtils');
      throw error;
    }
  },

  /**
   * Descarga productos desde la nube
   * Útil para restaurar datos
   */
  async restoreFromCloud() {
    try {
      logger.info(('☁️ Iniciando restauración desde la nube...');
      const result = await cloudSyncService.smartPull();
      
      if (result.success) {
        logger.info((`✅ Restauración completada: ${result.count} productos`);
      } else {
        logger.error(`❌ Error en restauración: ${result.error}`, 'DebugUtils');
      }
      
      return result;
    } catch (error) {
      logger.error('❌ Error en restauración:', error, 'DebugUtils');
      throw error;
    }
  },

  /**
   * Purgar datos locales
   * ⚠️ ¡PELIGROSO! Elimina todos los productos locales
   */
  async purgeLocal(confirm = false) {
    if (!confirm) {
      logger.warn('⚠️ Esta función es peligrosa. Para confirmar llama:', 'DebugUtils');
      logger.warn('   await DebugTools.purgeLocal(true, 'DebugUtils')');
      return { success: false, message: 'Confirmation required' };
    }

    try {
      logger.info(('🗑️ Purgando datos locales...');
      
      await productsCollection.database.write(async () => {
        const all = await productsCollection.query().fetch();
        logger.info((`   Eliminando ${all.length} productos...`);
        
        for (const record of all) {
          await record.destroyPermanently();
        }
      });
      
      logger.info(('✅ Datos locales purgados');
      return { success: true, message: 'Local data purged' };
    } catch (error) {
      logger.error('❌ Error purgando:', error, 'DebugUtils');
      throw error;
    }
  },

  /**
   * Estado de sincronización
   */
  async syncStatus() {
    try {
      const localCount = await productsCollection.query().fetchCount();
      const cloudCount = await cloudSyncService.getCloudCount();
      
      logger.info(('📊 Estado de Sincronización:');
      logger.info((`   Local:  ${localCount} productos`);
      logger.info((`   Cloud:  ${cloudCount} productos`);
      logger.info((`   Sync:   ${localCount === cloudCount ? '✅ Sincronizado' : '⚠️ Diferentes'}`);
      
      return { local: localCount, cloud: cloudCount, synced: localCount === cloudCount };
    } catch (error) {
      logger.error('❌ Error obteniendo estado:', error, 'DebugUtils');
      throw error;
    }
  },

  /**
   * Diagnóstico completo
   */
  async diagnose() {
    logger.info(('🔍 Iniciando diagnóstico...\n');
    
    logger.info(('=== Supabase ===');
    const supabase = (window as any).supabaseService;
    logger.info(('Configurado:', supabase?.isConfigured() ? '✅ Sí' : '❌ No');
    if (supabase?.isConfigured()) {
      const client = supabase?.getClient();
      logger.info(('Cliente listo:', client ? '✅ Sí' : '❌ No');
    }
    
    logger.info(('\n=== Base de Datos Local ===');
    const localCount = await productsCollection.query().fetchCount();
    logger.info(('Productos locales:', localCount);
    
    logger.info(('\n=== Nube ===');
    try {
      const cloudCount = await cloudSyncService.getCloudCount();
      logger.info(('Productos en la nube:', cloudCount);
    } catch (error) {
      logger.info(('Error consultando nube:', error);
    }
    
    logger.info(('\n✅ Diagnóstico completado');
  },

  /**
   * Descarga forzada desde la nube
   * Útil cuando la BD local está vacía pero la nube tiene productos
   */
  async forceReload() {
    try {
      logger.info(('🔄 Iniciando descarga forzada desde la nube...');
      
      const result = await dataService.forceReloadFromCloud();
      
      if (result.success) {
        logger.info((`✅ Descarga completada: ${result.count} productos`);
        logger.info(('🔄 Recargando la página...');
        setTimeout(() => window.location.reload(), 1500);
      } else {
        logger.error(`❌ Error: ${result.error}`, 'DebugUtils');
      }
      
      return result;
    } catch (error) {
      logger.error('❌ Error en descarga forzada:', error, 'DebugUtils');
      throw error;
    }
  }
};

// Exponer funciones directamente para acceso rápido
(window as any).exportProducts = () => (window as any).DebugTools.exportProducts();
(window as any).downloadProducts = () => (window as any).DebugTools.downloadProducts();
(window as any).backupToCloud = () => (window as any).DebugTools.backupToCloud();
(window as any).restoreFromCloud = () => (window as any).DebugTools.restoreFromCloud();
(window as any).syncStatus = () => (window as any).DebugTools.syncStatus();
(window as any).diagnose = () => (window as any).DebugTools.diagnose();
(window as any).forceReload = () => (window as any).DebugTools.forceReload();

logger.info((`
╔══════════════════════════════════════════════════════════════╗
║  🛠️  Debug Tools Disponibles                                ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  📤 exportProducts()      - Copia productos al portapapeles  ║
║  📥 downloadProducts()    - Descarga como archivo JSON        ║
║  ☁️  backupToCloud()       - Subir locales a Supabase        ║
║  ☁️  restoreFromCloud()    - Descargar desde Supabase         ║
║  🔄 forceReload()          - Forzar descarga desde nube       ║
║  📊 syncStatus()           - Ver estado de sincronización     ║
║  🔍 diagnose()             - Diagnóstico completo             ║
║                                                              ║
║  Ejemplo: await forceReload()                               ║
╚══════════════════════════════════════════════════════════════╝
`);
