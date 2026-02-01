import type { Ride } from "../../domain/ride.js";

export type RideLifecycleSuccess = {
  readonly success: true;
  readonly ride: Ride;
};

export type RideLifecycleFailure = {
  readonly success: false;
  readonly error: string;
};

export type RideLifecycleResult = RideLifecycleSuccess | RideLifecycleFailure;

export interface RideLifecycle {
  startPickup(rideId: string): Promise<RideLifecycleResult>;
  startRide(rideId: string): Promise<RideLifecycleResult>;
  completeRide(rideId: string): Promise<RideLifecycleResult>;
  cancelRide(rideId: string): Promise<RideLifecycleResult>;
}
