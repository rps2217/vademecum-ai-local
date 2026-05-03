import { schemaMigrations, addColumns, createTable } from '@nozbe/watermelondb/Schema/migrations';

export default schemaMigrations({
  migrations: [
    {
      toVersion: 2,
      steps: [
        createTable({
          name: 'drug_families',
          columns: [
            { name: 'name', type: 'string' },
          ],
        }),
        createTable({
          name: 'active_ingredients',
          columns: [
            { name: 'name', type: 'string' },
          ],
        }),
        createTable({
          name: 'ingredient_families',
          columns: [
            { name: 'ingredient_id', type: 'string', isIndexed: true },
            { name: 'family_id', type: 'string', isIndexed: true },
          ],
        }),
        createTable({
          name: 'drug_interactions',
          columns: [
            { name: 'source_family_id', type: 'string', isIndexed: true },
            { name: 'target_family_id', type: 'string', isIndexed: true },
            { name: 'description', type: 'string' },
          ],
        }),
      ],
    },
  ],
});
