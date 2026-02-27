import { Product } from '../core/types/product.types';
import { getDB } from '../core/database/db';

export class GoogleSyncService {
  private static readonly STORAGE_KEY = 'vademecum_gas_url';

  static getGasUrl(): string {
    return localStorage.getItem(this.STORAGE_KEY) || '';
  }

  static setGasUrl(url: string) {
    localStorage.setItem(this.STORAGE_KEY, url);
  }

  static async backupToCloud(): Promise<{ success: boolean; message: string }> {
    const url = this.getGasUrl();
    if (!url) {
      return { success: false, message: 'URL de Google Apps Script no configurada.' };
    }

    try {
      const db = await getDB();
      const products = await db.getAll('products');

      if (products.length === 0) {
        return { success: false, message: 'No hay productos locales para respaldar.' };
      }

      // Usamos text/plain para evitar el preflight OPTIONS de CORS que Google Apps Script bloquea
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify(products),
      });

      const result = await response.json();
      
      if (result.success) {
        return { success: true, message: `Respaldo exitoso: ${result.count} productos guardados en la nube.` };
      } else {
        throw new Error(result.error || 'Error desconocido en el servidor');
      }
    } catch (error: any) {
      console.error('Error en backupToCloud:', error);
      return { success: false, message: `Error de conexión: ${error.message}` };
    }
  }

  static async restoreFromCloud(): Promise<{ success: boolean; message: string; count?: number }> {
    const url = this.getGasUrl();
    if (!url) {
      return { success: false, message: 'URL de Google Apps Script no configurada.' };
    }

    try {
      const response = await fetch(url, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
      }

      const products: Product[] = await response.json();

      if (!Array.isArray(products)) {
        throw new Error('Formato de respuesta inválido desde Google Sheets.');
      }

      if (products.length === 0) {
        return { success: true, message: 'La base de datos en la nube está vacía.', count: 0 };
      }

      const db = await getDB();
      const tx = db.transaction('products', 'readwrite');
      
      // Opcional: Limpiar la base de datos local antes de restaurar
      // await tx.objectStore('products').clear();

      let count = 0;
      for (const product of products) {
        await tx.objectStore('products').put(product);
        count++;
      }
      
      await tx.done;

      return { success: true, message: `Restauración exitosa: ${count} productos descargados.`, count };
    } catch (error: any) {
      console.error('Error en restoreFromCloud:', error);
      return { success: false, message: `Error de conexión: ${error.message}` };
    }
  }

  static getGasScriptTemplate(): string {
    return `function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var products = JSON.parse(e.postData.contents);
    
    // Si envían un solo objeto en lugar de un array, lo convertimos a array
    if (!Array.isArray(products)) {
      products = [products];
    }
    
    if (!products || products.length === 0) {
      return ContentService.createTextOutput(JSON.stringify({success: true, count: 0, message: "No data received"}))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // Obtener datos actuales de la hoja
    var dataRange = sheet.getDataRange();
    var existingData = dataRange.getValues();
    
    var headers = [];
    var skuIndex = -1;
    var existingSkus = {}; // Mapa para búsqueda rápida de filas por SKU
    
    // Si la hoja está completamente vacía (sin encabezados)
    if (existingData.length === 0 || (existingData.length === 1 && existingData[0].join('') === '')) {
      // Usar las claves del primer producto como encabezados
      headers = Object.keys(products[0]);
      // Asegurar que 'sku' esté en los encabezados si no está
      if (headers.indexOf('sku') === -1) headers.unshift('sku');
      sheet.appendRow(headers);
      skuIndex = headers.indexOf('sku');
    } else {
      headers = existingData[0];
      skuIndex = headers.indexOf('sku');
      
      // Si por alguna razón no hay columna SKU, la agregamos
      if (skuIndex === -1) {
        headers.push('sku');
        sheet.getRange(1, headers.length).setValue('sku');
        skuIndex = headers.length - 1;
      }
      
      // Mapear SKUs existentes a sus números de fila (1-indexed en Google Sheets)
      for (var i = 1; i < existingData.length; i++) {
        var rowSku = existingData[i][skuIndex];
        if (rowSku) {
          existingSkus[rowSku.toString()] = i + 1; // +1 porque la fila 1 son los encabezados
        }
      }
    }
    
    var newRows = [];
    var updatedCount = 0;
    
    // Procesar cada producto entrante
    for (var p = 0; p < products.length; p++) {
      var product = products[p];
      // Generar un SKU temporal si no tiene
      if (!product.sku) {
        product.sku = 'GEN-' + new Date().getTime() + '-' + Math.floor(Math.random() * 1000);
      }
      var productSku = product.sku.toString();
      
      // Preparar la fila de datos asegurando el orden de los encabezados
      var rowData = headers.map(function(h) {
        var val = product[h];
        return typeof val === 'object' && val !== null ? JSON.stringify(val) : (val !== undefined ? val : '');
      });
      
      if (existingSkus[productSku]) {
        // ACTUALIZAR: El producto ya existe, sobrescribimos esa fila específica
        var rowNumber = existingSkus[productSku];
        sheet.getRange(rowNumber, 1, 1, headers.length).setValues([rowData]);
        updatedCount++;
      } else {
        // NUEVO: El producto no existe, lo guardamos para insertarlo al final
        newRows.push(rowData);
      }
    }
    
    // Insertar todas las filas nuevas de una sola vez (más eficiente)
    if (newRows.length > 0) {
      var lastRow = sheet.getLastRow();
      sheet.getRange(lastRow + 1, 1, newRows.length, headers.length).setValues(newRows);
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      success: true, 
      count: products.length,
      inserted: newRows.length,
      updated: updatedCount
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({success: false, error: error.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  // 1. Proxy para Web Scraping (Bypassa CORS)
  if (e.parameter.action === 'scrape') {
    try {
      var response = UrlFetchApp.fetch(e.parameter.url, { muteHttpExceptions: true });
      return ContentService.createTextOutput(JSON.stringify({ 
        success: true, 
        html: response.getContentText() 
      })).setMimeType(ContentService.MimeType.JSON);
    } catch (err) {
      return ContentService.createTextOutput(JSON.stringify({ success: false, error: err.toString() }))
        .setMimeType(ContentService.MimeType.JSON);
    }
  }

  // 2. Exportar datos a la aplicación (Sincronización)
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var data = sheet.getDataRange().getValues();
    
    if (data.length <= 1) {
      return ContentService.createTextOutput(JSON.stringify([]))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    var headers = data[0];
    var products = [];
    
    for (var i = 1; i < data.length; i++) {
      var obj = {};
      for (var j = 0; j < headers.length; j++) {
        var val = data[i][j];
        // Intentar parsear JSON strings (arrays/objetos)
        try {
          if (typeof val === 'string' && (val.startsWith('[') || val.startsWith('{'))) {
            val = JSON.parse(val);
          }
        } catch(err) {}
        obj[headers[j]] = val;
      }
      products.push(obj);
    }
    
    return ContentService.createTextOutput(JSON.stringify(products))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({error: error.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}`;
  }
}
