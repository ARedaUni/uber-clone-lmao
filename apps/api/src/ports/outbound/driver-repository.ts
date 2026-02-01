import type { Driver, DriverStatus } from "../../domain/driver.js";

export interface DriverRepository {
  save(driver: Driver): Promise<void>;
  findById(id: string): Promise<Driver | undefined>;
  findByStatus(status: DriverStatus): Promise<readonly Driver[]>;
}
