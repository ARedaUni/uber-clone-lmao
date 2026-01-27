import { describe, it, expect } from "vitest";
import { createDriver, goOffline, goOnline, assignToRide, completeRide, updateLocation } from "./driver.js";
import { createValidLocation, createTestDriver, createDriverInState } from "./test-factories.js";

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
      const driver1 = createTestDriver({ name: "John Doe" });
      const driver2 = createTestDriver({ name: "Jane Doe" });

      expect(driver1.id).toBeDefined();
      expect(driver2.id).toBeDefined();
      expect(driver1.id).not.toBe(driver2.id);
    });
  });

  describe("goOffline", () => {
    it("transitions an available driver to offline status", () => {
      const driver = createTestDriver();

      const result = goOffline(driver);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.driver.status).toBe("offline");
      }
    });
  });

  describe("goOnline", () => {
    it("transitions an offline driver to available status", () => {
      const driver = createDriverInState("offline");

      const result = goOnline(driver);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.driver.status).toBe("available");
      }
    });
  });

  describe("assignToRide", () => {
    it("transitions an available driver to busy status", () => {
      const driver = createTestDriver();

      const result = assignToRide(driver, "ride-123");

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.driver.status).toBe("busy");
        expect(result.driver.currentRideId).toBe("ride-123");
      }
    });
  });

  describe("completeRide", () => {
    it("transitions a busy driver to available status and clears currentRideId", () => {
      const driver = createDriverInState("busy");

      const result = completeRide(driver);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.driver.status).toBe("available");
        expect(result.driver.currentRideId).toBeUndefined();
      }
    });
  });

  describe("updateLocation", () => {
    it("updates the driver location", () => {
      const driver = createTestDriver();
      const newLocation = createValidLocation(37.7849, -122.4094);

      const result = updateLocation(driver, newLocation);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.driver.location).toEqual(newLocation);
      }
    });
  });

  describe("invalid state transitions", () => {
    it("cannot assign to ride if driver is offline", () => {
      const driver = createDriverInState("offline");

      const result = assignToRide(driver, "ride-123");

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Cannot assign ride to a driver that is not available");
      }
    });

    it("cannot go offline if driver is busy", () => {
      const driver = createDriverInState("busy");

      const result = goOffline(driver);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Cannot go offline while on a ride");
      }
    });

    it("cannot complete ride if driver is not busy", () => {
      const driver = createTestDriver();

      const result = completeRide(driver);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Cannot complete ride when driver is not on a ride");
      }
    });
  });
});
