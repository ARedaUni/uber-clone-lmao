import type { Location } from "./location.js";

export type RideStatus = "requested" | "driver_assigned" | "driver_en_route" | "in_progress" | "completed" | "cancelled";

export type Ride = {
  readonly id: string;
  readonly riderId: string;
  readonly pickup: Location;
  readonly dropoff: Location;
  readonly status: RideStatus;
  readonly driverId?: string;
};

type CreateRideInput = {
  readonly riderId: string;
  readonly pickup: Location;
  readonly dropoff: Location;
};

type RideOperationSuccess = {
  readonly success: true;
  readonly ride: Ride;
};

type RideOperationFailure = {
  readonly success: false;
  readonly error: string;
};

type RideOperationResult = RideOperationSuccess | RideOperationFailure;

export const createRide = (input: CreateRideInput): RideOperationResult => {
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

export const assignDriver = (ride: Ride, driverId: string): RideOperationResult => {
  if (ride.status !== "requested") {
    return {
      success: false,
      error: "Cannot assign driver to a ride that is not requested",
    };
  }

  return {
    success: true,
    ride: {
      ...ride,
      status: "driver_assigned",
      driverId,
    },
  };
};

export const startPickup = (ride: Ride): RideOperationResult => {
  return {
    success: true,
    ride: {
      ...ride,
      status: "driver_en_route",
    },
  };
};

export const startRide = (ride: Ride): RideOperationResult => {
  return {
    success: true,
    ride: {
      ...ride,
      status: "in_progress",
    },
  };
};

export const completeRide = (ride: Ride): RideOperationResult => {
  if (ride.status !== "in_progress") {
    return {
      success: false,
      error: "Cannot complete a ride that is not in progress",
    };
  }

  return {
    success: true,
    ride: {
      ...ride,
      status: "completed",
    },
  };
};

export const cancelRide = (ride: Ride): RideOperationResult => {
  return {
    success: true,
    ride: {
      ...ride,
      status: "cancelled",
    },
  };
};
