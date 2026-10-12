/**
 * Código de Google Apps Script para Vademecum AI
 *
 * Instrucciones de instalación:
 * 1. Crea una Hoja de Cálculo en Google Sheets (ej: "Vademecum_Catalogo").
 * 2. Crea 2 pestañas (hojas):
 *    - "Productos": Columnas: sku | name | brand | dosage_form | price | url | tags | is_active | ingredients_raw
 *    - "Ingredientes_Bridge": Columnas: product_sku | raw_name | ingredient_id | is_active_substance | confidence
 * 3. En Google Sheets, ve a Extensiones -> Apps Script.
 * 4. Pega este código completo en el editor (reemplaza cualquier código que haya).
 * 5. Haz clic en "Implementar" -> "Nueva implementación".
 * 6. Tipo: "Aplicación web".
 * 7. Ejecutar como: "Yo".
 * 8. Quién tiene acceso: "Cualquier persona" (Anyone).
 * 9. Copia la URL de la aplicación web y pégala en Vademecum AI (Ajustes -> Sincronización -> Google Sheets).
 */

const VERSION = "1.0.0";

function doGet(e) {
  try {
    const action = (e && e.parameter && e.parameter.action) || 'ping';

    if (action === 'ping') {
      return jsonResponse({
        status: 'ok',
        version: VERSION,
        serverTime: new Date().toISOString()
      });
    }

    if (action === 'getCatalog') {
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      const productsSheet = ss.getSheetByName('Productos');
      const bridgeSheet = ss.getSheetByName('Ingredientes_Bridge');

      const products = readProductsSheet(productsSheet);
      const productIngredients = bridgeSheet ? readBridgeSheet(bridgeSheet) : [];

      return jsonResponse({
        version: VERSION,
        updatedAt: new Date().toISOString(),
        counts: {
          products: products.length,
          bridge: productIngredients.length
        },
        products: products,
        productIngredients: productIngredients
      });
    }

    return jsonResponse({ error: 'Acción no reconocida: ' + action });
  } catch (err) {
    return jsonResponse({ error: err.toString() });
  }
}

function readProductsSheet(sheet) {
  if (!sheet) return [];
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];

  const headers = data[0].map(h => String(h).trim().toLowerCase());
  const rows = data.slice(1);

  const colIdx = {
    sku: headers.indexOf('sku'),
    name: headers.indexOf('name'),
    brand: headers.indexOf('brand'),
    dosage_form: headers.indexOf('dosage_form'),
    price: headers.indexOf('price'),
    url: headers.indexOf('url'),
    tags: headers.indexOf('tags'),
    is_active: headers.indexOf('is_active'),
    ingredients_raw: headers.indexOf('ingredients_raw')
  };

  const results = [];
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const sku = String(row[colIdx.sku] || '').trim();
    const name = String(row[colIdx.name] || '').trim();
    if (!sku || !name) continue;

    const rawTags = String(row[colIdx.tags] || '').trim();
    const rawIngs = String(row[colIdx.ingredients_raw] || '').trim();
    const priceVal = parseFloat(row[colIdx.price]);

    results.push({
      sku: sku,
      name: name,
      brand: colIdx.brand >= 0 ? String(row[colIdx.brand] || '').trim() : '',
      dosage_form: colIdx.dosage_form >= 0 ? String(row[colIdx.dosage_form] || '').trim() : '',
      price: isNaN(priceVal) ? null : priceVal,
      url: colIdx.url >= 0 ? String(row[colIdx.url] || '').trim() : '',
      tags: rawTags ? rawTags.split(',').map(s => s.trim()).filter(Boolean) : [],
      is_active: colIdx.is_active >= 0 ? (String(row[colIdx.is_active]).toLowerCase() !== 'false' && String(row[colIdx.is_active]) !== '0') : true,
      ingredients_raw: rawIngs ? rawIngs.split(',').map(s => s.trim()).filter(Boolean) : []
    });
  }

  return results;
}

function readBridgeSheet(sheet) {
  if (!sheet) return [];
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];

  const headers = data[0].map(h => String(h).trim().toLowerCase());
  const rows = data.slice(1);

  const colIdx = {
    product_sku: headers.indexOf('product_sku'),
    raw_name: headers.indexOf('raw_name'),
    ingredient_id: headers.indexOf('ingredient_id'),
    is_active_substance: headers.indexOf('is_active_substance'),
    confidence: headers.indexOf('confidence')
  };

  const results = [];
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const sku = String(row[colIdx.product_sku] || '').trim();
    const rawName = String(row[colIdx.raw_name] || '').trim();
    if (!sku || !rawName) continue;

    const confVal = parseFloat(row[colIdx.confidence]);

    results.push({
      product_sku: sku,
      raw_name: rawName,
      ingredient_id: colIdx.ingredient_id >= 0 ? String(row[colIdx.ingredient_id] || '').trim() : null,
      is_active_substance: colIdx.is_active_substance >= 0 ? String(row[colIdx.is_active_substance]).toLowerCase() !== 'false' : true,
      confidence: isNaN(confVal) ? 0.9 : confVal
    });
  }

  return results;
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
