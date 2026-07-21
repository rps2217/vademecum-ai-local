/**
 * Utilidades de Debug y Migración
 * 
 * Estas funciones están expuestas globalmente para ser llamadas desde la consola del navegador.
 * Útiles para diagnóstico y migración de datos.
 */

import { dataService } from '../services/DataService';
import { cloudSyncService } from '../services/CloudSyncService';
import { productsCollection } from '../database';
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
      console.log('📤 Exportando productos...');
      const json = await dataService.exportToJSON();
      
      // Copiar al portapapeles
      await navigator.clipboard.writeText(json);
      console.log(`✅ Exportados ${JSON.parse(json).length} productos al portapapeles`);
      
      // También guardar en localStorage como backup
      localStorage.setItem('vademecum_export_backup', json);
      console.log('💾 Backup guardado en localStorage');
      
      return json;
    } catch (error) {
      console.error('❌ Error exportando:', error);
      throw error;
    }
  },

  /**
   * Descarga los productos como archivo JSON
   */
  async downloadProducts() {
    try {
      console.log('📥 Descargando productos como archivo...');
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
      
      console.log(`✅ Descargados ${products.length} productos`);
      return products.length;
    } catch (error) {
      console.error('❌ Error descargando:', error);
      throw error;
    }
  },

  /**
   * Sube todos los productos locales a Supabase
   * Útil para respaldar datos en la nube
   */
  async backupToCloud() {
    try {
      console.log('☁️ Iniciando backup a la nube...');
      const result = await dataService.backupToCloud();
      
      if (result.success) {
        console.log(`✅ Backup completado: ${result.count} productos`);
      } else {
        console.error(`❌ Error en backup: ${result.error}`);
      }
      
      return result;
    } catch (error) {
      console.error('❌ Error en backup:', error);
      throw error;
    }
  },

  /**
   * Descarga productos desde la nube
   * Útil para restaurar datos
   */
  async restoreFromCloud() {
    try {
      console.log('☁️ Iniciando restauración desde la nube...');
      const result = await cloudSyncService.smartPull();
      
      if (result.success) {
        console.log(`✅ Restauración completada: ${result.count} productos`);
      } else {
        console.error(`❌ Error en restauración: ${result.error}`);
      }
      
      return result;
    } catch (error) {
      console.error('❌ Error en restauración:', error);
      throw error;
    }
  },

  /**
   * Purgar datos locales
   * ⚠️ ¡PELIGROSO! Elimina todos los productos locales
   */
  async purgeLocal(confirm = false) {
    if (!confirm) {
      console.warn('⚠️ Esta función es peligrosa. Para confirmar llama:');
      console.warn('   await DebugTools.purgeLocal(true)');
      return { success: false, message: 'Confirmation required' };
    }

    try {
      console.log('🗑️ Purgando datos locales...');
      
      await productsCollection.database.write(async () => {
        const all = await productsCollection.query().fetch();
        console.log(`   Eliminando ${all.length} productos...`);
        
        for (const record of all) {
          await record.destroyPermanently();
        }
      });
      
      console.log('✅ Datos locales purgados');
      return { success: true, message: 'Local data purged' };
    } catch (error) {
      console.error('❌ Error purgando:', error);
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
      
      console.log('📊 Estado de Sincronización:');
      console.log(`   Local:  ${localCount} productos`);
      console.log(`   Cloud:  ${cloudCount} productos`);
      console.log(`   Sync:   ${localCount === cloudCount ? '✅ Sincronizado' : '⚠️ Diferentes'}`);
      
      return { local: localCount, cloud: cloudCount, synced: localCount === cloudCount };
    } catch (error) {
      console.error('❌ Error obteniendo estado:', error);
      throw error;
    }
  },

  /**
   * Diagnóstico completo
   */
  async diagnose() {
    console.log('🔍 Iniciando diagnóstico...\n');
    
    console.log('=== Supabase ===');
    const supabase = (window as any).supabaseService;
    console.log('Configurado:', supabase?.isConfigured() ? '✅ Sí' : '❌ No');
    if (supabase?.isConfigured()) {
      const client = supabase?.getClient();
      console.log('Cliente listo:', client ? '✅ Sí' : '❌ No');
    }
    
    console.log('\n=== Base de Datos Local ===');
    const localCount = await productsCollection.query().fetchCount();
    console.log('Productos locales:', localCount);
    
    console.log('\n=== Nube ===');
    try {
      const cloudCount = await cloudSyncService.getCloudCount();
      console.log('Productos en la nube:', cloudCount);
    } catch (error) {
      console.log('Error consultando nube:', error);
    }
    
    console.log('\n✅ Diagnóstico completado');
  }
};

// Exponer funciones directamente para acceso rápido
(window as any).exportProducts = () => (window as any).DebugTools.exportProducts();
(window as any).downloadProducts = () => (window as any).DebugTools.downloadProducts();
(window as any).backupToCloud = () => (window as any).DebugTools.backupToCloud();
(window as any).restoreFromCloud = () => (window as any).DebugTools.restoreFromCloud();
(window as any).syncStatus = () => (window as any).DebugTools.syncStatus();
(window as any).diagnose = () => (window as any).DebugTools.diagnose();

console.log(`
╔══════════════════════════════════════════════════════════════╗
║  🛠️  Debug Tools Disponibles                                ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  📤 exportProducts()      - Copia productos al portapapeles  ║
║  📥 downloadProducts()    - Descarga como archivo JSON        ║
║  ☁️  backupToCloud()       - Subir locales a Supabase        ║
║  ☁️  restoreFromCloud()    - Descargar desde Supabase         ║
║  📊 syncStatus()           - Ver estado de sincronización      ║
║  🔍 diagnose()             - Diagnóstico completo             ║
║                                                              ║
║  Ejemplo: await backupToCloud()                              ║
╚══════════════════════════════════════════════════════════════╝
`);
