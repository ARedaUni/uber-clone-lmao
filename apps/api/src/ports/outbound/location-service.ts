import type { Location } from "../../domain/location.js";

export type NearbyDriver = {
  readonly driverId: string;
  readonly distanceKm: number;
};

export interface LocationService {
  updateDriverLocation(driverId: string, location: Location): Promise<void>;
  findNearbyDrivers(location: Location, radiusKm: number): Promise<readonly NearbyDriver[]>;
}
