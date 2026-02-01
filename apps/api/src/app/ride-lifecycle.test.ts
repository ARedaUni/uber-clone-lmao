import type { Ride } from "../domain/ride.js";
import type { Driver } from "../domain/driver.js";
import {
  createRideInState,
  createDriverInState,
} from "../domain/test-factories.js";
import { createRideLifecycleService } from "./ride-lifecycle.js";

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

const createFakeDriverRepository = (driver?: Driver) => {
  const saved: Driver[] = [];
  return {
    save: async (d: Driver) => {
      saved.push(d);
    },
    findById: async () => driver,
    findByStatus: async () => [] as readonly Driver[],
    saved,
  };
};

describe("ride lifecycle service", () => {
  describe("startPickup", () => {
    it("transitions ride from driver_assigned to driver_en_route", async () => {
      const ride = createRideInState("driver_assigned");
      const rideRepository = createFakeRideRepository(ride);
      const driverRepository = createFakeDriverRepository();

      const service = createRideLifecycleService({
        rideRepository,
        driverRepository,
      });

      const result = await service.startPickup(ride.id);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.ride.status).toBe("driver_en_route");
      }
      expect(rideRepository.saved).toHaveLength(1);
      expect(rideRepository.saved[0]!.status).toBe("driver_en_route");
    });

    it("returns failure when ride is not found", async () => {
      const rideRepository = createFakeRideRepository(undefined);
      const driverRepository = createFakeDriverRepository();

      const service = createRideLifecycleService({
        rideRepository,
        driverRepository,
      });

      const result = await service.startPickup("nonexistent-ride");

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Ride not found");
      }
    });

    it("returns failure when ride is not in driver_assigned status", async () => {
      const ride = createRideInState("requested");
      const rideRepository = createFakeRideRepository(ride);
      const driverRepository = createFakeDriverRepository();

      const service = createRideLifecycleService({
        rideRepository,
        driverRepository,
      });

      const result = await service.startPickup(ride.id);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe(
          "Cannot start pickup for a ride without an assigned driver",
        );
      }
    });
  });

  describe("startRide", () => {
    it("transitions ride from driver_en_route to in_progress", async () => {
      const ride = createRideInState("driver_en_route");
      const rideRepository = createFakeRideRepository(ride);
      const driverRepository = createFakeDriverRepository();

      const service = createRideLifecycleService({
        rideRepository,
        driverRepository,
      });

      const result = await service.startRide(ride.id);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.ride.status).toBe("in_progress");
      }
      expect(rideRepository.saved).toHaveLength(1);
      expect(rideRepository.saved[0]!.status).toBe("in_progress");
    });

    it("returns failure when ride is not found", async () => {
      const rideRepository = createFakeRideRepository(undefined);
      const driverRepository = createFakeDriverRepository();

      const service = createRideLifecycleService({
        rideRepository,
        driverRepository,
      });

      const result = await service.startRide("nonexistent-ride");

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Ride not found");
      }
    });

    it("returns failure when ride is not in driver_en_route status", async () => {
      const ride = createRideInState("requested");
      const rideRepository = createFakeRideRepository(ride);
      const driverRepository = createFakeDriverRepository();

      const service = createRideLifecycleService({
        rideRepository,
        driverRepository,
      });

      const result = await service.startRide(ride.id);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe(
          "Cannot start a ride that is not en route to pickup",
        );
      }
    });
  });
});
