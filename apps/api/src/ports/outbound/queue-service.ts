export interface QueueService {
  enqueue<T>(queueName: string, data: T): Promise<void>;
}
