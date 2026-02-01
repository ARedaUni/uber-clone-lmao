import { assignDriver } from "../domain/ride.js";
import { assignToRide } from "../domain/driver.js";
import type { DriverMatcher } from "../ports/inbound/driver-matcher.js";
import type { RideRepository } from "../ports/outbound/ride-repository.js";
import type { DriverRepository } from "../ports/outbound/driver-repository.js";
import type { LocationService } from "../ports/outbound/location-service.js";
import type { LockService } from "../ports/outbound/lock-service.js";

type DriverMatchingDependencies = {
  readonly rideRepository: RideRepository;
  readonly driverRepository: DriverRepository;
  readonly locationService: LocationService;
  readonly lockService: LockService;
  readonly searchRadiusKm: number;
};

const LOCK_TTL_MS = 5000;

export const createDriverMatchingService = (deps: DriverMatchingDependencies): DriverMatcher => ({
  matchDriver: async (rideId) => {
    const ride = await deps.rideRepository.findById(rideId);
    if (!ride) {
      return { success: false, reason: "Ride not found" };
    }

    if (ride.status !== "requested") {
      return { success: false, reason: "Ride is not in requested status" };
    }

    const nearbyDrivers = await deps.locationService.findNearbyDrivers(
      ride.pickup,
      deps.searchRadiusKm,
    );

    for (const candidate of nearbyDrivers) {
      const lockKey = `driver-matching:${candidate.driverId}`;
      const locked = await deps.lockService.acquireLock(lockKey, LOCK_TTL_MS);

      if (!locked) {
        continue;
      }

      try {
        const driver = await deps.driverRepository.findById(candidate.driverId);
        if (!driver) {
          continue;
        }

        const driverResult = assignToRide(driver, rideId);
        if (!driverResult.success) {
          continue;
        }

        const rideResult = assignDriver(ride, candidate.driverId);
        if (!rideResult.success) {
          continue;
        }

        await deps.driverRepository.save(driverResult.driver);
        await deps.rideRepository.save(rideResult.ride);

        return { success: true, driverId: candidate.driverId };
      } finally {
        await deps.lockService.releaseLock(lockKey);
      }
    }

    return { success: false, reason: "No available drivers found nearby" };
  },
});
