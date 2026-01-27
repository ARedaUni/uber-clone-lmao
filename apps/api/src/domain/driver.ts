import type { Location } from "./location.js";

export type DriverStatus = "available" | "offline" | "busy";

export type Driver = {
  readonly id: string;
  readonly name: string;
  readonly location: Location;
  readonly status: DriverStatus;
  readonly currentRideId?: string;
};

type CreateDriverInput = {
  readonly name: string;
  readonly location: Location;
};

type DriverOperationSuccess = {
  readonly success: true;
  readonly driver: Driver;
};

type DriverOperationFailure = {
  readonly success: false;
  readonly error: string;
};

type DriverOperationResult = DriverOperationSuccess | DriverOperationFailure;

export const createDriver = (input: CreateDriverInput): DriverOperationResult => {
  return {
    success: true,
    driver: {
      id: crypto.randomUUID(),
      name: input.name,
      location: input.location,
      status: "available",
    },
  };
};

export const goOffline = (driver: Driver): DriverOperationResult => {
  if (driver.status === "busy") {
    return {
      success: false,
      error: "Cannot go offline while on a ride",
    };
  }

  return {
    success: true,
    driver: {
      ...driver,
      status: "offline",
    },
  };
};

export const goOnline = (driver: Driver): DriverOperationResult => {
  return {
    success: true,
    driver: {
      ...driver,
      status: "available",
    },
  };
};

export const assignToRide = (driver: Driver, rideId: string): DriverOperationResult => {
  if (driver.status !== "available") {
    return {
      success: false,
      error: "Cannot assign ride to a driver that is not available",
    };
  }

  return {
    success: true,
    driver: {
      ...driver,
      status: "busy",
      currentRideId: rideId,
    },
  };
};

export const completeRide = (driver: Driver): DriverOperationResult => {
  if (driver.status !== "busy") {
    return {
      success: false,
      error: "Cannot complete ride when driver is not on a ride",
    };
  }

  const { currentRideId: _, ...rest } = driver;
  return {
    success: true,
    driver: {
      ...rest,
      status: "available",
    },
  };
};

export const updateLocation = (driver: Driver, location: Location): DriverOperationResult => {
  return {
    success: true,
    driver: {
      ...driver,
      location,
    },
  };
};
