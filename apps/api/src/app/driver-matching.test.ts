import type { Ride } from "../domain/ride.js";
import type { Driver } from "../domain/driver.js";
import { createTestRide } from "../domain/test-factories.js";
import { createTestDriver } from "../domain/test-factories.js";
import type { NearbyDriver } from "../ports/outbound/location-service.js";
import { createDriverMatchingService } from "./driver-matching.js";

const createFakeRideRepository = (ride?: Ride) => {
  const saved: Ride[] = [];
  return {
    save: async (r: Ride) => {
      saved.push(r);
    },
    findById: async () => ride,
    findByRiderId: async () => [] as readonly Ride[],
    findByStatus: async () => [] as readonly Ride[],
    saved,
  };
};

const createFakeDriverRepository = (drivers: Map<string, Driver>) => {
  const saved: Driver[] = [];
  return {
    save: async (d: Driver) => {
      saved.push(d);
    },
    findById: async (id: string) => drivers.get(id),
    findByStatus: async () => [] as readonly Driver[],
    saved,
  };
};

const createFakeLocationService = (nearby: readonly NearbyDriver[]) => ({
  updateDriverLocation: async () => {},
  findNearbyDrivers: async () => nearby,
});

const createFakeLockService = (lockedKeys = new Set<string>()) => {
  const released: string[] = [];
  return {
    acquireLock: async (key: string) => {
      if (lockedKeys.has(key)) return false;
      lockedKeys.add(key);
      return true;
    },
    releaseLock: async (key: string) => {
      released.push(key);
    },
    released,
  };
};

describe("driver matching service", () => {
  it("assigns a nearby available driver to the ride", async () => {
    const ride = createTestRide({ riderId: "rider-1" });
    const driver = createTestDriver({ name: "Jane" });

    const rideRepository = createFakeRideRepository(ride);
    const driverRepository = createFakeDriverRepository(
      new Map([[driver.id, driver]]),
    );
    const locationService = createFakeLocationService([
      { driverId: driver.id, distanceKm: 1.5 },
    ]);
    const lockService = createFakeLockService();

    const service = createDriverMatchingService({
      rideRepository,
      driverRepository,
      locationService,
      lockService,
      searchRadiusKm: 5,
    });

    const result = await service.matchDriver(ride.id);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.driverId).toBe(driver.id);
    }
    expect(rideRepository.saved).toHaveLength(1);
    expect(rideRepository.saved[0]!.status).toBe("driver_assigned");
    expect(rideRepository.saved[0]!.driverId).toBe(driver.id);
    expect(driverRepository.saved).toHaveLength(1);
    expect(driverRepository.saved[0]!.status).toBe("busy");
    expect(driverRepository.saved[0]!.currentRideId).toBe(ride.id);
  });

  it("returns failure when ride is not found", async () => {
    const rideRepository = createFakeRideRepository(undefined);
    const driverRepository = createFakeDriverRepository(new Map());
    const locationService = createFakeLocationService([]);
    const lockService = createFakeLockService();

    const service = createDriverMatchingService({
      rideRepository,
      driverRepository,
      locationService,
      lockService,
      searchRadiusKm: 5,
    });

    const result = await service.matchDriver("nonexistent-ride");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.reason).toBe("Ride not found");
    }
  });

  it("returns failure when no nearby drivers are found", async () => {
    const ride = createTestRide({ riderId: "rider-1" });
    const rideRepository = createFakeRideRepository(ride);
    const driverRepository = createFakeDriverRepository(new Map());
    const locationService = createFakeLocationService([]);
    const lockService = createFakeLockService();

    const service = createDriverMatchingService({
      rideRepository,
      driverRepository,
      locationService,
      lockService,
      searchRadiusKm: 5,
    });

    const result = await service.matchDriver(ride.id);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.reason).toBe("No available drivers found nearby");
    }
  });

  it("skips driver whose lock cannot be acquired and tries next", async () => {
    const ride = createTestRide({ riderId: "rider-1" });
    const lockedDriver = createTestDriver({ name: "Locked" });
    const availableDriver = createTestDriver({ name: "Available" });

    const rideRepository = createFakeRideRepository(ride);
    const driverRepository = createFakeDriverRepository(
      new Map([
        [lockedDriver.id, lockedDriver],
        [availableDriver.id, availableDriver],
      ]),
    );
    const locationService = createFakeLocationService([
      { driverId: lockedDriver.id, distanceKm: 1.0 },
      { driverId: availableDriver.id, distanceKm: 2.0 },
    ]);
    const lockService = createFakeLockService(
      new Set([`driver-matching:${lockedDriver.id}`]),
    );

    const service = createDriverMatchingService({
      rideRepository,
      driverRepository,
      locationService,
      lockService,
      searchRadiusKm: 5,
    });

    const result = await service.matchDriver(ride.id);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.driverId).toBe(availableDriver.id);
    }
  });

  it("releases the lock after successful assignment", async () => {
    const ride = createTestRide({ riderId: "rider-1" });
    const driver = createTestDriver({ name: "Jane" });

    const rideRepository = createFakeRideRepository(ride);
    const driverRepository = createFakeDriverRepository(
      new Map([[driver.id, driver]]),
    );
    const locationService = createFakeLocationService([
      { driverId: driver.id, distanceKm: 1.5 },
    ]);
    const lockService = createFakeLockService();

    const service = createDriverMatchingService({
      rideRepository,
      driverRepository,
      locationService,
      lockService,
      searchRadiusKm: 5,
    });

    await service.matchDriver(ride.id);

    expect(lockService.released).toHaveLength(1);
    expect(lockService.released[0]).toBe(`driver-matching:${driver.id}`);
  });
});
