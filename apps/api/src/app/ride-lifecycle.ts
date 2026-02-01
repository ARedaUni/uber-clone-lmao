import {
  startPickup as startPickupDomain,
  startRide as startRideDomain,
  completeRide as completeRideDomain,
  cancelRide as cancelRideDomain,
} from "../domain/ride.js";
import { completeRide as completeDriverRide } from "../domain/driver.js";
import type { RideLifecycle } from "../ports/inbound/ride-lifecycle.js";
import type { RideRepository } from "../ports/outbound/ride-repository.js";
import type { DriverRepository } from "../ports/outbound/driver-repository.js";

type RideLifecycleDependencies = {
  readonly rideRepository: RideRepository;
  readonly driverRepository: DriverRepository;
};

export const createRideLifecycleService = (
  deps: RideLifecycleDependencies,
): RideLifecycle => ({
  startPickup: async (rideId) => {
    const ride = await deps.rideRepository.findById(rideId);
    if (!ride) {
      return { success: false, error: "Ride not found" };
    }

    const result = startPickupDomain(ride);
    if (!result.success) {
      return { success: false, error: result.error };
    }

    await deps.rideRepository.save(result.ride);
    return { success: true, ride: result.ride };
  },

  startRide: async (rideId) => {
    const ride = await deps.rideRepository.findById(rideId);
    if (!ride) {
      return { success: false, error: "Ride not found" };
    }

    const result = startRideDomain(ride);
    if (!result.success) {
      return { success: false, error: result.error };
    }

    await deps.rideRepository.save(result.ride);
    return { success: true, ride: result.ride };
  },

  completeRide: async (rideId) => {
    const ride = await deps.rideRepository.findById(rideId);
    if (!ride) {
      return { success: false, error: "Ride not found" };
    }

    const rideResult = completeRideDomain(ride);
    if (!rideResult.success) {
      return { success: false, error: rideResult.error };
    }

    if (!ride.driverId) {
      return { success: false, error: "Driver not found" };
    }

    const driver = await deps.driverRepository.findById(ride.driverId);
    if (!driver) {
      return { success: false, error: "Driver not found" };
    }

    const driverResult = completeDriverRide(driver);
    if (!driverResult.success) {
      return { success: false, error: driverResult.error };
    }

    await deps.rideRepository.save(rideResult.ride);
    await deps.driverRepository.save(driverResult.driver);
    return { success: true, ride: rideResult.ride };
  },

  cancelRide: async (rideId) => {
    const ride = await deps.rideRepository.findById(rideId);
    if (!ride) {
      return { success: false, error: "Ride not found" };
    }

    const rideResult = cancelRideDomain(ride);
    if (!rideResult.success) {
      return { success: false, error: rideResult.error };
    }

    await deps.rideRepository.save(rideResult.ride);

    if (ride.driverId) {
      const driver = await deps.driverRepository.findById(ride.driverId);
      if (driver) {
        const driverResult = completeDriverRide(driver);
        if (driverResult.success) {
          await deps.driverRepository.save(driverResult.driver);
        }
      }
    }

    return { success: true, ride: rideResult.ride };
  },
});
