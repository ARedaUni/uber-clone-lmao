import type { QueueService } from "../../../ports/outbound/queue-service.js";

export const createInMemoryQueueService = (): QueueService => {
  const queues = new Map<string, readonly unknown[]>();

  return {
    enqueue: async <T>(queueName: string, data: T): Promise<void> => {
      const existing = queues.get(queueName) ?? [];
      queues.set(queueName, [...existing, data]);
    },
  };
};
