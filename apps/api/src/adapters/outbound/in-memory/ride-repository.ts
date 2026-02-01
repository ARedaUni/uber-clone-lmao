import type { Ride, RideStatus } from "../../../domain/ride.js";
import type { RideRepository } from "../../../ports/outbound/ride-repository.js";

export const createInMemoryRideRepository = (): RideRepository => {
  const rides = new Map<string, Ride>();

  return {
    save: async (ride: Ride): Promise<void> => {
      rides.set(ride.id, ride);
    },

    findById: async (id: string): Promise<Ride | undefined> => {
      return rides.get(id);
    },

    findByRiderId: async (riderId: string): Promise<readonly Ride[]> => {
      return [...rides.values()].filter((ride) => ride.riderId === riderId);
    },

    findByStatus: async (status: RideStatus): Promise<readonly Ride[]> => {
      return [...rides.values()].filter((ride) => ride.status === status);
    },
  };
};
