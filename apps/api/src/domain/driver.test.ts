import { describe, it, expect } from "vitest";
import { createDriver, goOffline, goOnline, assignToRide, completeRide, updateLocation } from "./driver.js";
import { createValidLocation } from "./test-factories.js";

describe("Driver", () => {
  describe("createDriver", () => {
    it("creates a driver with a location in available status", () => {
      const location = createValidLocation(37.7749, -122.4194);

      const result = createDriver({ name: "John Doe", location });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.driver.name).toBe("John Doe");
        expect(result.driver.location).toEqual(location);
        expect(result.driver.status).toBe("available");
      }
    });

    it("generates a unique id for each driver", () => {
      const location = createValidLocation(37.7749, -122.4194);

      const result1 = createDriver({ name: "John Doe", location });
      const result2 = createDriver({ name: "Jane Doe", location });

      if (!result1.success || !result2.success) {
        throw new Error("Failed to create drivers");
      }

      expect(result1.driver.id).toBeDefined();
      expect(result2.driver.id).toBeDefined();
      expect(result1.driver.id).not.toBe(result2.driver.id);
    });
  });

  describe("goOffline", () => {
    it("transitions an available driver to offline status", () => {
      const location = createValidLocation(37.7749, -122.4194);
      const createResult = createDriver({ name: "John Doe", location });
      if (!createResult.success) throw new Error("Failed to create driver");

      const result = goOffline(createResult.driver);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.driver.status).toBe("offline");
      }
    });
  });

  describe("goOnline", () => {
    it("transitions an offline driver to available status", () => {
      const location = createValidLocation(37.7749, -122.4194);
      const createResult = createDriver({ name: "John Doe", location });
      if (!createResult.success) throw new Error("Failed to create driver");
      const offlineResult = goOffline(createResult.driver);
      if (!offlineResult.success) throw new Error("Failed to go offline");

      const result = goOnline(offlineResult.driver);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.driver.status).toBe("available");
      }
    });
  });

  describe("assignToRide", () => {
    it("transitions an available driver to busy status", () => {
      const location = createValidLocation(37.7749, -122.4194);
      const createResult = createDriver({ name: "John Doe", location });
      if (!createResult.success) throw new Error("Failed to create driver");

      const result = assignToRide(createResult.driver, "ride-123");

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.driver.status).toBe("busy");
        expect(result.driver.currentRideId).toBe("ride-123");
      }
    });
  });

  describe("completeRide", () => {
    it("transitions a busy driver to available status and clears currentRideId", () => {
      const location = createValidLocation(37.7749, -122.4194);
      const createResult = createDriver({ name: "John Doe", location });
      if (!createResult.success) throw new Error("Failed to create driver");
      const assignedResult = assignToRide(createResult.driver, "ride-123");
      if (!assignedResult.success) throw new Error("Failed to assign to ride");

      const result = completeRide(assignedResult.driver);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.driver.status).toBe("available");
        expect(result.driver.currentRideId).toBeUndefined();
      }
    });
  });

  describe("updateLocation", () => {
    it("updates the driver location", () => {
      const initialLocation = createValidLocation(37.7749, -122.4194);
      const newLocation = createValidLocation(37.7849, -122.4094);
      const createResult = createDriver({ name: "John Doe", location: initialLocation });
      if (!createResult.success) throw new Error("Failed to create driver");

      const result = updateLocation(createResult.driver, newLocation);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.driver.location).toEqual(newLocation);
      }
    });
  });

  describe("invalid state transitions", () => {
    it("cannot assign to ride if driver is offline", () => {
      const location = createValidLocation(37.7749, -122.4194);
      const createResult = createDriver({ name: "John Doe", location });
      if (!createResult.success) throw new Error("Failed to create driver");
      const offlineResult = goOffline(createResult.driver);
      if (!offlineResult.success) throw new Error("Failed to go offline");

      const result = assignToRide(offlineResult.driver, "ride-123");

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Cannot assign ride to a driver that is not available");
      }
    });

    it("cannot go offline if driver is busy", () => {
      const location = createValidLocation(37.7749, -122.4194);
      const createResult = createDriver({ name: "John Doe", location });
      if (!createResult.success) throw new Error("Failed to create driver");
      const assignedResult = assignToRide(createResult.driver, "ride-123");
      if (!assignedResult.success) throw new Error("Failed to assign to ride");

      const result = goOffline(assignedResult.driver);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Cannot go offline while on a ride");
      }
    });

    it("cannot complete ride if driver is not busy", () => {
      const location = createValidLocation(37.7749, -122.4194);
      const createResult = createDriver({ name: "John Doe", location });
      if (!createResult.success) throw new Error("Failed to create driver");

      const result = completeRide(createResult.driver);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Cannot complete ride when driver is not on a ride");
      }
    });
  });
});
