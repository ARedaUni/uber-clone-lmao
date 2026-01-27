import { describe, it, expect } from "vitest";
import { createRide, assignDriver, startPickup, startRide, completeRide, cancelRide } from "./ride.js";
import { createTestRide, createRideInState, createValidLocation } from "./test-factories.js";

describe("Ride", () => {
  describe("createRide", () => {
    it("creates a ride with pickup and dropoff locations in requested status", () => {
      const pickup = createValidLocation(37.7749, -122.4194);
      const dropoff = createValidLocation(34.0522, -118.2437);

      const result = createRide({ riderId: "rider-123", pickup, dropoff });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.ride.riderId).toBe("rider-123");
        expect(result.ride.pickup).toEqual(pickup);
        expect(result.ride.dropoff).toEqual(dropoff);
        expect(result.ride.status).toBe("requested");
      }
    });

    it("generates a unique id for each ride", () => {
      const ride1 = createTestRide();
      const ride2 = createTestRide();

      expect(ride1.id).toBeDefined();
      expect(ride2.id).toBeDefined();
      expect(ride1.id).not.toBe(ride2.id);
    });
  });

  describe("assignDriver", () => {
    it("transitions a requested ride to driver_assigned status", () => {
      const ride = createTestRide();

      const result = assignDriver(ride, "driver-456");

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.ride.status).toBe("driver_assigned");
        expect(result.ride.driverId).toBe("driver-456");
      }
    });
  });

  describe("startPickup", () => {
    it("transitions a driver_assigned ride to driver_en_route status", () => {
      const ride = createRideInState("driver_assigned");

      const result = startPickup(ride);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.ride.status).toBe("driver_en_route");
      }
    });
  });

  describe("startRide", () => {
    it("transitions a driver_en_route ride to in_progress status", () => {
      const ride = createRideInState("driver_en_route");

      const result = startRide(ride);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.ride.status).toBe("in_progress");
      }
    });
  });

  describe("completeRide", () => {
    it("transitions an in_progress ride to completed status", () => {
      const ride = createRideInState("in_progress");

      const result = completeRide(ride);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.ride.status).toBe("completed");
      }
    });
  });

  describe("cancelRide", () => {
    it("transitions a requested ride to cancelled status", () => {
      const ride = createTestRide();

      const result = cancelRide(ride);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.ride.status).toBe("cancelled");
      }
    });
  });

  describe("invalid state transitions", () => {
    it("cannot complete a ride that is still requested", () => {
      const ride = createTestRide();

      const result = completeRide(ride);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Cannot complete a ride that is not in progress");
      }
    });

    it("cannot assign a driver to a ride that is already in progress", () => {
      const ride = createRideInState("in_progress");

      const result = assignDriver(ride, "driver-789");

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Cannot assign driver to a ride that is not requested");
      }
    });

    it("cannot start pickup for a ride that is still requested", () => {
      const ride = createTestRide();

      const result = startPickup(ride);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Cannot start pickup for a ride without an assigned driver");
      }
    });

    it("cannot start a ride that is not en route to pickup", () => {
      const ride = createTestRide();

      const result = startRide(ride);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Cannot start a ride that is not en route to pickup");
      }
    });

    it("cannot cancel a ride that is already completed", () => {
      const ride = createRideInState("completed");

      const result = cancelRide(ride);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Cannot cancel a ride that is already completed or cancelled");
      }
    });
  });
});
