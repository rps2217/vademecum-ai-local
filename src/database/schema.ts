import { appSchema, tableSchema } from '@nozbe/watermelondb';

export const schema = appSchema({
  version: 2,
  tables: [
    tableSchema({
      name: 'products',
      columns: [
        { name: 'sku', type: 'string', isIndexed: true },
        { name: 'nombre_comercial', type: 'string' },
        { name: 'descripcion', type: 'string' },
        { name: 'principios_activos_json', type: 'string' },
        { name: 'posologia', type: 'string' },
        { name: 'indicaciones_json', type: 'string' },
        { name: 'advertencias', type: 'string' },
        { name: 'tags_ia_json', type: 'string' },
        { name: 'categoria_principal', type: 'string', isIndexed: true },
        { name: 'analisis_componentes', type: 'string', isOptional: true },
        { name: 'anotaciones_componentes_json', type: 'string', isOptional: true },
        { name: 'vectores_json', type: 'string', isOptional: true },
        { name: 'apto_embarazo', type: 'string' },
        { name: 'apto_lactancia', type: 'string' },
        { name: 'apto_pediatria', type: 'string' },
        { name: 'apto_diabeticos', type: 'string' },
        { name: 'apto_hipertensos', type: 'string' },
        { name: 'apto_celiacos', type: 'string' },
        { name: 'sugerencia_complementaria', type: 'string', isOptional: true },
        { name: 'skus_relacionados_json', type: 'string', isOptional: true },
        { name: 'explicacion_clinica', type: 'string', isOptional: true },
        { name: 'synergy_analyzed', type: 'boolean', isOptional: true },
        { name: 'last_synergy_analysis', type: 'number', isOptional: true },
        { name: 'synergy_retries', type: 'number', isOptional: true },
        { name: 'locked_by_ai', type: 'boolean', isOptional: true },
        { name: 'lock_uid', type: 'string', isOptional: true },
        { name: 'lock_timestamp', type: 'number', isOptional: true },
        { name: 'source_url', type: 'string', isOptional: true },
        { name: 'last_updated', type: 'number', isIndexed: true },
        { name: 'is_verified', type: 'boolean', isOptional: true },
        { name: 'verified_at', type: 'number', isOptional: true },
        { name: 'verified_by', type: 'string', isOptional: true },
        { name: 'is_synced_cloud', type: 'boolean', isOptional: true },
        { name: 'last_synced_cloud', type: 'number', isOptional: true },
      ],
    }),
    tableSchema({
      name: 'tasks',
      columns: [
        { name: 'type', type: 'string' },
        { name: 'payload_json', type: 'string' },
        { name: 'timestamp', type: 'number', isIndexed: true },
        { name: 'status', type: 'string', isIndexed: true },
        { name: 'retries', type: 'number' },
        { name: 'last_error', type: 'string', isOptional: true },
        { name: 'priority', type: 'number', isIndexed: true },
        { name: 'earliest_retry_timestamp', type: 'number', isOptional: true },
      ],
    }),
    tableSchema({
      name: 'drug_families',
      columns: [
        { name: 'name', type: 'string' },
      ],
    }),
    tableSchema({
      name: 'active_ingredients',
      columns: [
        { name: 'name', type: 'string' },
      ],
    }),
    tableSchema({
      name: 'ingredient_families',
      columns: [
        { name: 'ingredient_id', type: 'string', isIndexed: true },
        { name: 'family_id', type: 'string', isIndexed: true },
      ],
    }),
    tableSchema({
      name: 'drug_interactions',
      columns: [
        { name: 'source_family_id', type: 'string', isIndexed: true },
        { name: 'target_family_id', type: 'string', isIndexed: true },
        { name: 'description', type: 'string' },
      ],
    }),
  ],
});
