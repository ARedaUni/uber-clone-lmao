import { createLocation, type Location } from "./location.js";
import {
  createRide,
  assignDriver,
  startPickup,
  startRide,
  completeRide,
  type Ride,
  type RideStatus,
} from "./ride.js";
import {
  createDriver,
  goOffline,
  assignToRide,
  type Driver,
  type DriverStatus,
} from "./driver.js";

export const createValidLocation = (latitude: number, longitude: number): Location => {
  const result = createLocation({ latitude, longitude });
  if (!result.success) {
    throw new Error(`Invalid test location: ${result.error}`);
  }
  return result.location;
};

type CreateTestRideOptions = {
  readonly riderId?: string;
  readonly pickup?: Location;
  readonly dropoff?: Location;
};

export const createTestRide = (options: CreateTestRideOptions = {}): Ride => {
  const pickup = options.pickup ?? createValidLocation(37.7749, -122.4194);
  const dropoff = options.dropoff ?? createValidLocation(34.0522, -118.2437);
  const riderId = options.riderId ?? "rider-123";

  const result = createRide({ riderId, pickup, dropoff });
  if (!result.success) {
    throw new Error("Failed to create test ride");
  }
  return result.ride;
};

type CreateRideInStateOptions = CreateTestRideOptions & {
  readonly driverId?: string;
};

export const createRideInState = (
  status: RideStatus,
  options: CreateRideInStateOptions = {}
): Ride => {
  const driverId = options.driverId ?? "driver-456";
  let ride = createTestRide(options);

  if (status === "requested") return ride;

  const assigned = assignDriver(ride, driverId);
  if (!assigned.success) throw new Error("Failed to assign driver");
  ride = assigned.ride;
  if (status === "driver_assigned") return ride;

  const enRoute = startPickup(ride);
  if (!enRoute.success) throw new Error("Failed to start pickup");
  ride = enRoute.ride;
  if (status === "driver_en_route") return ride;

  const inProgress = startRide(ride);
  if (!inProgress.success) throw new Error("Failed to start ride");
  ride = inProgress.ride;
  if (status === "in_progress") return ride;

  const completed = completeRide(ride);
  if (!completed.success) throw new Error("Failed to complete ride");
  if (status === "completed") return completed.ride;

  throw new Error(`Cannot create ride in state: ${status}`);
};

type CreateTestDriverOptions = {
  readonly name?: string;
  readonly location?: Location;
};

export const createTestDriver = (options: CreateTestDriverOptions = {}): Driver => {
  const name = options.name ?? "John Doe";
  const location = options.location ?? createValidLocation(37.7749, -122.4194);

  const result = createDriver({ name, location });
  if (!result.success) {
    throw new Error("Failed to create test driver");
  }
  return result.driver;
};

type CreateDriverInStateOptions = CreateTestDriverOptions & {
  readonly rideId?: string;
};

export const createDriverInState = (
  status: DriverStatus,
  options: CreateDriverInStateOptions = {}
): Driver => {
  const rideId = options.rideId ?? "ride-123";
  let driver = createTestDriver(options);

  if (status === "available") return driver;

  if (status === "offline") {
    const offline = goOffline(driver);
    if (!offline.success) throw new Error("Failed to go offline");
    return offline.driver;
  }

  if (status === "busy") {
    const assigned = assignToRide(driver, rideId);
    if (!assigned.success) throw new Error("Failed to assign to ride");
    return assigned.driver;
  }

  throw new Error(`Cannot create driver in state: ${status}`);
};
