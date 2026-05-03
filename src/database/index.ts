import { Database } from '@nozbe/watermelondb';
import LokiJSAdapter from '@nozbe/watermelondb/adapters/lokijs';
import { schema } from './schema';
import migrations from './migrations';
import Product from './Product';
import Task from './Task';
import DrugFamily from './DrugFamily';
import ActiveIngredient from './ActiveIngredient';
import IngredientFamily from './IngredientFamily';
import DrugInteraction from './DrugInteraction';

const adapter = new LokiJSAdapter({
  schema,
  migrations,
  useIncrementalIndexedDB: true,
  useWebWorker: false,
  onQuotaExceededError: (error) => {
    console.error('LokiJS Disk quota exceeded', error);
  },
  onSetUpError: (error) => {
    console.error('LokiJS Set Up Error', error);
  }
});


export const database = new Database({
  adapter,
  modelClasses: [Product, Task, DrugFamily, ActiveIngredient, IngredientFamily, DrugInteraction],
});


export const productsCollection = database.get<Product>('products');
export const tasksCollection = database.get<Task>('tasks');
export const drugFamiliesCollection = database.get<DrugFamily>('drug_families');
export const activeIngredientsCollection = database.get<ActiveIngredient>('active_ingredients');
export const ingredientFamiliesCollection = database.get<IngredientFamily>('ingredient_families');
export const drugInteractionsCollection = database.get<DrugInteraction>('drug_interactions');
