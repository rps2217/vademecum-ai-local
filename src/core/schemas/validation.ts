/**
 * Zod Schemas - Validación de datos de entrada
 * Centraliza todas las validaciones de la aplicación
 */

import { z } from 'zod';

// ==================== PRODUCT SCHEMAS ====================

export const PrincipioActivoSchema = z.object({
  id: z.string().optional(),
  nombre: z.string().min(1, 'Nombre requerido'),
  concentracion: z.string().optional(),
  unidad: z.string().optional(),
});

export const CategoriaSchema = z.object({
  id: z.string(),
  nombre: z.string().min(1),
  icono: z.string().optional(),
  color: z.string().optional(),
});

export const AlertaSeguridadSchema = z.object({
  tipo: z.enum(['warning', 'contraindicacion', 'interaccion', 'efecto_adverso']),
  mensaje: z.string().min(1),
  nivel: z.enum(['bajo', 'medio', 'alto', 'critico']).optional(),
});

export const SinergiaSchema = z.object({
  hacia: z.string(),
  descripcion: z.string(),
  nivel: z.enum(['bajo', 'medio', 'alto']).optional(),
});

export const AntagonismoSchema = z.object({
  hacia: z.string(),
  descripcion: z.string(),
  nivel: z.enum(['bajo', 'medio', 'alto']).optional(),
});

// Producto principal
export const ProductSchema = z.object({
  sku: z.string().min(1, 'SKU requerido'),
  nombre_comercial: z.string().min(1, 'Nombre comercial requerido'),
  descripcion: z.string().optional().default(''),
  principios_activos: z.array(z.union([z.string(), z.object({
    id: z.string().optional(),
    nombre: z.string(),
    concentracion: z.string().optional(),
  })])).default([]),
  categoria_principal: z.string().optional().default('General'),
  categorias: z.array(z.string()).default([]),
  laboratorio: z.string().optional(),
  precio: z.number().min(0).optional(),
  presentacion: z.string().optional(),
  forma_farmaceutica: z.string().optional(),
  via_administracion: z.string().optional(),
  contraindicaciones: z.array(z.string()).default([]),
  alertas_seguridad: z.array(AlertaSeguridadSchema).default([]),
  synergias: z.array(SinergiaSchema).default([]),
  antagonismos: z.array(AntagonismoSchema).default([]),
  tags: z.array(z.string()).default([]),
  imagen_url: z.string().url().optional(),
  prospecto_url: z.string().url().optional(),
  ficha_tecnica_url: z.string().url().optional(),
  // Metadatos
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
  source: z.enum(['local', 'cloud', 'scrape']).optional(),
});

// Validación parcial para actualizaciones
export const ProductUpdateSchema = ProductSchema.partial().omit({ sku: true });

// ==================== INGREDIENT SCHEMAS ====================

export const IngredientSchema = z.object({
  id: z.string().min(1),
  nombre: z.string().min(1),
  sinonimos: z.array(z.string()).default([]),
  familia: z.string().optional(),
  tipo: z.enum(['activo', 'excipiente', 'aditivo']).optional(),
  propiedades: z.array(z.string()).default([]),
  beneficios: z.array(z.string()).default([]),
  contraindicaciones: z.array(z.string()).default([]),
  dosis_recomendada: z.string().optional(),
  mecanismo_accion: z.string().optional(),
  categoria: z.string().optional(),
  descripcion: z.string().optional(),
});

// ==================== SYNC SCHEMAS ====================

export const SyncPayloadSchema = z.object({
  version: z.string(),
  timestamp: z.number(),
  products: z.array(ProductSchema),
  force: z.boolean().optional().default(false),
});

export const SyncResultSchema = z.object({
  success: z.boolean(),
  synced: z.number().optional(),
  skipped: z.number().optional(),
  errors: z.number().optional(),
  message: z.string().optional(),
});

// ==================== SEARCH SCHEMAS ====================

export const SearchQuerySchema = z.object({
  query: z.string().min(1).max(500),
  filters: z.object({
    category: z.string().optional(),
    maxPrice: z.number().min(0).optional(),
    minPrice: z.number().min(0).optional(),
    laboratorio: z.string().optional(),
    forma_farmaceutica: z.string().optional(),
  }).optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
});

export const SearchResultSchema = z.object({
  products: z.array(ProductSchema),
  total: z.number(),
  page: z.number(),
  totalPages: z.number(),
});

// ==================== VALIDATION HELPERS ====================

export function validateProduct(data: unknown) {
  return ProductSchema.safeParse(data);
}

export function validateProducts(data: unknown) {
  if (!Array.isArray(data)) {
    return { success: false, error: { message: 'Expected array of products' } };
  }
  
  const results = data.map((item, index) => ({
    index,
    result: ProductSchema.safeParse(item),
  }));
  
  const errors = results.filter(r => !r.result.success);
  const valid = results.filter(r => r.result.success);
  
  return {
    success: errors.length === 0,
    validCount: valid.length,
    errorCount: errors.length,
    errors: errors.map(e => ({
      index: e.index,
      issues: e.result.error.issues,
    })),
    products: valid.map(r => r.result.data),
  };
}

export function validateSyncPayload(data: unknown) {
  return SyncPayloadSchema.safeParse(data);
}

export function validateSearchQuery(data: unknown) {
  return SearchQuerySchema.safeParse(data);
}

// ==================== TYPE EXPORTS ====================

export type ProductInput = z.infer<typeof ProductSchema>;
export type ProductUpdate = z.infer<typeof ProductUpdateSchema>;
export type Ingredient = z.infer<typeof IngredientSchema>;
export type SyncPayload = z.infer<typeof SyncPayloadSchema>;
export type SearchQuery = z.infer<typeof SearchQuerySchema>;
