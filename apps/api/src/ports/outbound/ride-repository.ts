import type { Ride, RideStatus } from "../../domain/ride.js";

export interface RideRepository {
  save(ride: Ride): Promise<void>;
  findById(id: string): Promise<Ride | undefined>;
  findByRiderId(riderId: string): Promise<readonly Ride[]>;
  findByStatus(status: RideStatus): Promise<readonly Ride[]>;
}
