import { describe, it, expect } from "vitest";
import { createRide } from "./ride.js";
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
});
