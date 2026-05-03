import { database, drugFamiliesCollection, activeIngredientsCollection, ingredientFamiliesCollection, drugInteractionsCollection } from '../database';

export async function seedDrugData() {
  await database.write(async () => {
    // 1. Create Families
    const ainFamily = await drugFamiliesCollection.create(f => {
      f.name = 'AINEs';
    });
    const cortiFamily = await drugFamiliesCollection.create(f => {
      f.name = 'Corticoides';
    });

    // 2. Create Ingredients
    const ibu = await activeIngredientsCollection.create(i => {
      i.name = 'Ibuprofeno';
    });
    const pred = await activeIngredientsCollection.create(i => {
      i.name = 'Prednisona';
    });

    // 3. Link Ingredients to Families
    await ingredientFamiliesCollection.create(i => {
      i.ingredientId = ibu.id;
      i.familyId = ainFamily.id;
    });
    await ingredientFamiliesCollection.create(i => {
      i.ingredientId = pred.id;
      i.familyId = cortiFamily.id;
    });

    // 4. Create Interaction
    await drugInteractionsCollection.create(d => {
      d.sourceFamilyId = ainFamily.id;
      d.targetFamilyId = cortiFamily.id;
      d.description = 'Aumento del riesgo de complicaciones gastrointestinales';
    });
  });
}
