import { Model } from '@nozbe/watermelondb';
import { text } from '@nozbe/watermelondb/decorators';

export default class DrugInteraction extends Model {
  static table = 'drug_interactions';
  
  @text('source_family_id') sourceFamilyId!: string;
  @text('target_family_id') targetFamilyId!: string;
  @text('description') description!: string;
}
