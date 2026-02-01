import type { Location } from "../../../domain/location.js";
import { calculateDistanceKm } from "../../../domain/location.js";
import type { LocationService, NearbyDriver } from "../../../ports/outbound/location-service.js";

export const createInMemoryLocationService = (): LocationService => {
  const locations = new Map<string, Location>();

  return {
    updateDriverLocation: async (driverId: string, location: Location): Promise<void> => {
      locations.set(driverId, location);
    },

    findNearbyDrivers: async (location: Location, radiusKm: number): Promise<readonly NearbyDriver[]> => {
      return [...locations.entries()]
        .map(([driverId, driverLocation]) => ({
          driverId,
          distanceKm: calculateDistanceKm(location, driverLocation),
        }))
        .filter((entry) => entry.distanceKm <= radiusKm)
        .sort((a, b) => a.distanceKm - b.distanceKm);
    },
  };
};
