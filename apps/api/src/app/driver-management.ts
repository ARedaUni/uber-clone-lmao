import {
  goOnline as goOnlineDomain,
  goOffline as goOfflineDomain,
  updateLocation as updateLocationDomain,
} from "../domain/driver.js";
import type { DriverManager } from "../ports/inbound/driver-manager.js";
import type { DriverRepository } from "../ports/outbound/driver-repository.js";
import type { LocationService } from "../ports/outbound/location-service.js";

type DriverManagementDependencies = {
  readonly driverRepository: DriverRepository;
  readonly locationService: LocationService;
};

export const createDriverManagementService = (
  deps: DriverManagementDependencies,
): DriverManager => ({
  goOnline: async (driverId) => {
    const driver = await deps.driverRepository.findById(driverId);
    if (!driver) {
      return { success: false, error: "Driver not found" };
    }

    const result = goOnlineDomain(driver);
    if (!result.success) {
      return { success: false, error: result.error };
    }

    await deps.driverRepository.save(result.driver);
    return { success: true, driver: result.driver };
  },

  goOffline: async (driverId) => {
    const driver = await deps.driverRepository.findById(driverId);
    if (!driver) {
      return { success: false, error: "Driver not found" };
    }

    const result = goOfflineDomain(driver);
    if (!result.success) {
      return { success: false, error: result.error };
    }

    await deps.driverRepository.save(result.driver);
    return { success: true, driver: result.driver };
  },

  updateLocation: async (driverId, location) => {
    const driver = await deps.driverRepository.findById(driverId);
    if (!driver) {
      return { success: false, error: "Driver not found" };
    }

    const result = updateLocationDomain(driver, location);
    if (!result.success) {
      return { success: false, error: result.error };
    }

    await deps.driverRepository.save(result.driver);
    await deps.locationService.updateDriverLocation(driverId, location);
    return { success: true, driver: result.driver };
  },
});
