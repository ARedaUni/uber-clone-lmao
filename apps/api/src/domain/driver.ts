import type { Location } from "./location.js";

export type DriverStatus = "available" | "offline";

export type Driver = {
  readonly id: string;
  readonly name: string;
  readonly location: Location;
  readonly status: DriverStatus;
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
  return {
    success: true,
    driver: {
      ...driver,
      status: "offline",
    },
  };
};
