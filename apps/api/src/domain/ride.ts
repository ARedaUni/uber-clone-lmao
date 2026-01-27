import type { Location } from "./location.js";

export type RideStatus = "requested";

export type Ride = {
  readonly id: string;
  readonly riderId: string;
  readonly pickup: Location;
  readonly dropoff: Location;
  readonly status: RideStatus;
};

type CreateRideInput = {
  readonly riderId: string;
  readonly pickup: Location;
  readonly dropoff: Location;
};

type CreateRideSuccess = {
  readonly success: true;
  readonly ride: Ride;
};

type CreateRideResult = CreateRideSuccess;

export const createRide = (input: CreateRideInput): CreateRideResult => {
  return {
    success: true,
    ride: {
      id: crypto.randomUUID(),
      riderId: input.riderId,
      pickup: input.pickup,
      dropoff: input.dropoff,
      status: "requested",
    },
  };
};
