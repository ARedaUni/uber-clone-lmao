import {
  startPickup as startPickupDomain,
  startRide as startRideDomain,
} from "../domain/ride.js";
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

  completeRide: async () => {
    return { success: false, error: "Not implemented" };
  },

  cancelRide: async () => {
    return { success: false, error: "Not implemented" };
  },
});
