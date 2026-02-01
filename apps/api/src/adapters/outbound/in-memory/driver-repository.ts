import type { Driver, DriverStatus } from "../../../domain/driver.js";
import type { DriverRepository } from "../../../ports/outbound/driver-repository.js";

export const createInMemoryDriverRepository = (): DriverRepository => {
  const drivers = new Map<string, Driver>();

  return {
    save: async (driver: Driver): Promise<void> => {
      drivers.set(driver.id, driver);
    },

    findById: async (id: string): Promise<Driver | undefined> => {
      return drivers.get(id);
    },

    findByStatus: async (status: DriverStatus): Promise<readonly Driver[]> => {
      return [...drivers.values()].filter((driver) => driver.status === status);
    },
  };
};
