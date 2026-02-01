import type { Location } from "../../domain/location.js";
import type { Ride } from "../../domain/ride.js";

export type RequestRideInput = {
  readonly riderId: string;
  readonly pickup: Location;
  readonly dropoff: Location;
};

export type RequestRideSuccess = {
  readonly success: true;
  readonly ride: Ride;
};

export type RequestRideFailure = {
  readonly success: false;
  readonly error: string;
};

export type RequestRideResult = RequestRideSuccess | RequestRideFailure;

export interface RideRequester {
  requestRide(input: RequestRideInput): Promise<RequestRideResult>;
}
