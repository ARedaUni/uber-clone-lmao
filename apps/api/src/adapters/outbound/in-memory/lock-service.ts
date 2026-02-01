import type { LockService } from "../../../ports/outbound/lock-service.js";

export const createInMemoryLockService = (): LockService => {
  const locks = new Set<string>();
  const timers = new Map<string, ReturnType<typeof setTimeout>>();

  return {
    acquireLock: async (key: string, ttlMs: number): Promise<boolean> => {
      if (locks.has(key)) return false;

      locks.add(key);
      const timer = setTimeout(() => {
        locks.delete(key);
        timers.delete(key);
      }, ttlMs);
      timers.set(key, timer);

      return true;
    },

    releaseLock: async (key: string): Promise<void> => {
      locks.delete(key);
      const timer = timers.get(key);
      if (timer) {
        clearTimeout(timer);
        timers.delete(key);
      }
    },
  };
};
