import Ajv, { JSONSchemaType } from 'ajv';

const ajv = new Ajv({ allErrors: true, removeAdditional: true, useDefaults: true });

// Schema para una respuesta simple de Producto (Extracción, Reanálisis, PDF, Imagen)
export const productExtractionSchema = {
  type: "object",
  properties: {
    sku: { type: "string" },
    nombre_comercial: { type: "string" },
    descripcion: { type: "string" },
    principios_activos: { type: "array", items: { type: "string" } },
    posologia: { type: "string" },
    indicaciones: { type: "array", items: { type: "string" } },
    advertencias: { type: "string" },
    tags_ia: { type: "array", items: { type: "string" } },
    categoria_principal: { type: "string", enum: ["Belleza", "Medicamento", "Suplemento", "Homeopatía", "Otro"] },
    analisis_componentes: { type: "string" },
    apto_embarazo: { type: "string", enum: ["SI", "NO", "PRECAUCION", ""] },
    apto_lactancia: { type: "string", enum: ["SI", "NO", "PRECAUCION", ""] },
    apto_pediatria: { type: "string", enum: ["SI", "NO", "PRECAUCION", ""] },
    apto_diabeticos: { type: "string", enum: ["SI", "NO", "PRECAUCION", ""] },
    apto_hipertensos: { type: "string", enum: ["SI", "NO", "PRECAUCION", ""] },
    apto_celiacos: { type: "string", enum: ["SI", "NO", "PRECAUCION", ""] },
    sugerencia_complementaria: { type: "string" },
    anotaciones_componentes: { type: "object", additionalProperties: { type: "string" } }
  },
  required: ["nombre_comercial"],
  additionalProperties: true
};

export const validateProductExtraction = ajv.compile(productExtractionSchema);

// Schema para múltiples productos (cleanAndValidateProducts)
export const productListSchema = {
  type: "array",
  items: productExtractionSchema
};

export const validateProductList = ajv.compile(productListSchema);

// Schema para analyzeInteractions
export const interactionAnalysisSchema = {
  type: "object",
  properties: {
    riesgo_total: { type: "string", enum: ["BAJO", "MEDIO", "ALTO", "CRITICO"] },
    interacciones: {
      type: "array",
      items: {
        type: "object",
        properties: {
          productos: { type: "array", items: { type: "string" } },
          gravedad: { type: "string", enum: ["LEVE", "MODERADA", "GRAVE"] },
          descripcion: { type: "string" },
          recomendacion: { type: "string" }
        },
        required: ["productos", "gravedad", "descripcion", "recomendacion"],
        additionalProperties: true
      }
    },
    resumen_clinico: { type: "string" }
  },
  required: ["riesgo_total", "interacciones", "resumen_clinico"],
  additionalProperties: true
};

export const validateInteractionAnalysis = ajv.compile(interactionAnalysisSchema);

// Schema para analyzeSynergy
export const synergyAnalysisSchema = {
  type: "object",
  properties: {
    sugerencia_complementaria: { type: "string" },
    skus_relacionados: { type: "array", items: { type: "string" } },
    explicacion_clinica: { type: "string" }
  },
  required: ["skus_relacionados", "explicacion_clinica"],
  additionalProperties: true
};

export const validateSynergyAnalysis = ajv.compile(synergyAnalysisSchema);

// Schema para explainActiveIngredients
export const explanationSchema = {
  type: "object",
  additionalProperties: { type: "string" }
};

export const validateExplanation = ajv.compile(explanationSchema);
