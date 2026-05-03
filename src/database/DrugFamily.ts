import { Model } from '@nozbe/watermelondb';
import { field, text } from '@nozbe/watermelondb/decorators';

export default class DrugFamily extends Model {
  static table = 'drug_families';
  
  @text('name') name!: string;
}
