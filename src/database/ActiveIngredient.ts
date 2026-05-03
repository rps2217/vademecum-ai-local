import { Model } from '@nozbe/watermelondb';
import { text } from '@nozbe/watermelondb/decorators';

export default class ActiveIngredient extends Model {
  static table = 'active_ingredients';
  
  @text('name') name!: string;
}
