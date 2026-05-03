import { Model } from '@nozbe/watermelondb';
import { field } from '@nozbe/watermelondb/decorators';

export default class IngredientFamily extends Model {
  static table = 'ingredient_families';
  
  @field('ingredient_id') ingredientId!: string;
  @field('family_id') familyId!: string;
}
