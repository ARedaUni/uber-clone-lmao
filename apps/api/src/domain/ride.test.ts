import { describe, it, expect } from "vitest";
import { createRide, assignDriver, startPickup, startRide, completeRide, cancelRide } from "./ride.js";
import { createLocation } from "./location.js";

describe("Ride", () => {
  describe("createRide", () => {
    it("creates a ride with pickup and dropoff locations in requested status", () => {
      const pickupResult = createLocation({ latitude: 37.7749, longitude: -122.4194 });
      const dropoffResult = createLocation({ latitude: 34.0522, longitude: -118.2437 });

      if (!pickupResult.success || !dropoffResult.success) {
        throw new Error("Invalid test locations");
      }

      const result = createRide({
        riderId: "rider-123",
        pickup: pickupResult.location,
        dropoff: dropoffResult.location,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.ride.riderId).toBe("rider-123");
        expect(result.ride.pickup).toEqual(pickupResult.location);
        expect(result.ride.dropoff).toEqual(dropoffResult.location);
        expect(result.ride.status).toBe("requested");
      }
    });

    it("generates a unique id for each ride", () => {
      const pickupResult = createLocation({ latitude: 37.7749, longitude: -122.4194 });
      const dropoffResult = createLocation({ latitude: 34.0522, longitude: -118.2437 });

      if (!pickupResult.success || !dropoffResult.success) {
        throw new Error("Invalid test locations");
      }

      const result1 = createRide({
        riderId: "rider-123",
        pickup: pickupResult.location,
        dropoff: dropoffResult.location,
      });

      const result2 = createRide({
        riderId: "rider-123",
        pickup: pickupResult.location,
        dropoff: dropoffResult.location,
      });

      if (!result1.success || !result2.success) {
        throw new Error("Failed to create rides");
      }

      expect(result1.ride.id).toBeDefined();
      expect(result2.ride.id).toBeDefined();
      expect(result1.ride.id).not.toBe(result2.ride.id);
    });
  });

  describe("assignDriver", () => {
    it("transitions a requested ride to driver_assigned status", () => {
      const pickupResult = createLocation({ latitude: 37.7749, longitude: -122.4194 });
      const dropoffResult = createLocation({ latitude: 34.0522, longitude: -118.2437 });

      if (!pickupResult.success || !dropoffResult.success) {
        throw new Error("Invalid test locations");
      }

      const rideResult = createRide({
        riderId: "rider-123",
        pickup: pickupResult.location,
        dropoff: dropoffResult.location,
      });

      if (!rideResult.success) {
        throw new Error("Failed to create ride");
      }

      const result = assignDriver(rideResult.ride, "driver-456");

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.ride.status).toBe("driver_assigned");
        expect(result.ride.driverId).toBe("driver-456");
      }
    });
  });

  describe("startPickup", () => {
    it("transitions a driver_assigned ride to driver_en_route status", () => {
      const pickupResult = createLocation({ latitude: 37.7749, longitude: -122.4194 });
      const dropoffResult = createLocation({ latitude: 34.0522, longitude: -118.2437 });

      if (!pickupResult.success || !dropoffResult.success) {
        throw new Error("Invalid test locations");
      }

      const rideResult = createRide({
        riderId: "rider-123",
        pickup: pickupResult.location,
        dropoff: dropoffResult.location,
      });

      if (!rideResult.success) {
        throw new Error("Failed to create ride");
      }

      const assignedResult = assignDriver(rideResult.ride, "driver-456");

      if (!assignedResult.success) {
        throw new Error("Failed to assign driver");
      }

      const result = startPickup(assignedResult.ride);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.ride.status).toBe("driver_en_route");
      }
    });
  });

  describe("startRide", () => {
    it("transitions a driver_en_route ride to in_progress status", () => {
      const pickupResult = createLocation({ latitude: 37.7749, longitude: -122.4194 });
      const dropoffResult = createLocation({ latitude: 34.0522, longitude: -118.2437 });

      if (!pickupResult.success || !dropoffResult.success) {
        throw new Error("Invalid test locations");
      }

      const rideResult = createRide({
        riderId: "rider-123",
        pickup: pickupResult.location,
        dropoff: dropoffResult.location,
      });

      if (!rideResult.success) {
        throw new Error("Failed to create ride");
      }

      const assignedResult = assignDriver(rideResult.ride, "driver-456");
      if (!assignedResult.success) {
        throw new Error("Failed to assign driver");
      }

      const enRouteResult = startPickup(assignedResult.ride);
      if (!enRouteResult.success) {
        throw new Error("Failed to start pickup");
      }

      const result = startRide(enRouteResult.ride);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.ride.status).toBe("in_progress");
      }
    });
  });

  describe("completeRide", () => {
    it("transitions an in_progress ride to completed status", () => {
      const pickupResult = createLocation({ latitude: 37.7749, longitude: -122.4194 });
      const dropoffResult = createLocation({ latitude: 34.0522, longitude: -118.2437 });

      if (!pickupResult.success || !dropoffResult.success) {
        throw new Error("Invalid test locations");
      }

      const rideResult = createRide({
        riderId: "rider-123",
        pickup: pickupResult.location,
        dropoff: dropoffResult.location,
      });

      if (!rideResult.success) {
        throw new Error("Failed to create ride");
      }

      const assignedResult = assignDriver(rideResult.ride, "driver-456");
      if (!assignedResult.success) {
        throw new Error("Failed to assign driver");
      }

      const enRouteResult = startPickup(assignedResult.ride);
      if (!enRouteResult.success) {
        throw new Error("Failed to start pickup");
      }

      const inProgressResult = startRide(enRouteResult.ride);
      if (!inProgressResult.success) {
        throw new Error("Failed to start ride");
      }

      const result = completeRide(inProgressResult.ride);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.ride.status).toBe("completed");
      }
    });
  });

  describe("cancelRide", () => {
    it("transitions a requested ride to cancelled status", () => {
      const pickupResult = createLocation({ latitude: 37.7749, longitude: -122.4194 });
      const dropoffResult = createLocation({ latitude: 34.0522, longitude: -118.2437 });

      if (!pickupResult.success || !dropoffResult.success) {
        throw new Error("Invalid test locations");
      }

      const rideResult = createRide({
        riderId: "rider-123",
        pickup: pickupResult.location,
        dropoff: dropoffResult.location,
      });

      if (!rideResult.success) {
        throw new Error("Failed to create ride");
      }

      const result = cancelRide(rideResult.ride);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.ride.status).toBe("cancelled");
      }
    });
  });

  describe("invalid state transitions", () => {
    it("cannot complete a ride that is still requested", () => {
      const pickupResult = createLocation({ latitude: 37.7749, longitude: -122.4194 });
      const dropoffResult = createLocation({ latitude: 34.0522, longitude: -118.2437 });

      if (!pickupResult.success || !dropoffResult.success) {
        throw new Error("Invalid test locations");
      }

      const rideResult = createRide({
        riderId: "rider-123",
        pickup: pickupResult.location,
        dropoff: dropoffResult.location,
      });

      if (!rideResult.success) {
        throw new Error("Failed to create ride");
      }

      const result = completeRide(rideResult.ride);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Cannot complete a ride that is not in progress");
      }
    });

    it("cannot assign a driver to a ride that is already in progress", () => {
      const pickupResult = createLocation({ latitude: 37.7749, longitude: -122.4194 });
      const dropoffResult = createLocation({ latitude: 34.0522, longitude: -118.2437 });

      if (!pickupResult.success || !dropoffResult.success) {
        throw new Error("Invalid test locations");
      }

      const rideResult = createRide({
        riderId: "rider-123",
        pickup: pickupResult.location,
        dropoff: dropoffResult.location,
      });

      if (!rideResult.success) {
        throw new Error("Failed to create ride");
      }

      const assignedResult = assignDriver(rideResult.ride, "driver-456");
      if (!assignedResult.success) {
        throw new Error("Failed to assign driver");
      }

      const enRouteResult = startPickup(assignedResult.ride);
      if (!enRouteResult.success) {
        throw new Error("Failed to start pickup");
      }

      const inProgressResult = startRide(enRouteResult.ride);
      if (!inProgressResult.success) {
        throw new Error("Failed to start ride");
      }

      const result = assignDriver(inProgressResult.ride, "driver-789");

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Cannot assign driver to a ride that is not requested");
      }
    });
  });
});
