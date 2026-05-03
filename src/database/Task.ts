import { Model } from '@nozbe/watermelondb';
import { field, text } from '@nozbe/watermelondb/decorators';
import { PendingTask } from '../services/TaskQueueService';

export default class Task extends Model {
  static table = 'tasks';

  @text('type') type!: string;
  @text('payload_json') payloadJson!: string;
  @field('timestamp') timestamp!: number;
  @text('status') status!: string;
  @field('retries') retries!: number;
  @text('last_error') lastError?: string;
  @field('priority') priority!: number;
  @field('earliest_retry_timestamp') earliestRetryTimestamp?: number;

  get payload(): any {
    try {
      return JSON.parse(this.payloadJson || '{}');
    } catch {
      return {};
    }
  }

  asJSON(): PendingTask {
    return {
      id: this.id,
      type: this.type as any,
      payload: this.payload,
      timestamp: this.timestamp,
      status: this.status as any,
      retries: this.retries,
      lastError: this.lastError,
      priority: this.priority,
      earliestRetryTimestamp: this.earliestRetryTimestamp,
    };
  }
}
