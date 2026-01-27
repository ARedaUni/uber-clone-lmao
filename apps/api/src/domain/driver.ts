import type { Location } from "./location.js";

export type DriverStatus = "available";

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

type CreateDriverSuccess = {
  readonly success: true;
  readonly driver: Driver;
};

type CreateDriverFailure = {
  readonly success: false;
  readonly error: string;
};

type CreateDriverResult = CreateDriverSuccess | CreateDriverFailure;

export const createDriver = (input: CreateDriverInput): CreateDriverResult => {
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
