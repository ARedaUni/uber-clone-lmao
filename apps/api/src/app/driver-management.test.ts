import type { Driver } from "../domain/driver.js";
import type { Location } from "../domain/location.js";
import {
  createDriverInState,
  createValidLocation,
} from "../domain/test-factories.js";
import { createDriverManagementService } from "./driver-management.js";

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

const createFakeLocationService = () => {
  const updates: Array<{ driverId: string; location: Location }> = [];
  return {
    updateDriverLocation: async (driverId: string, location: Location) => {
      updates.push({ driverId, location });
    },
    findNearbyDrivers: async () => [] as const,
    updates,
  };
};

describe("driver management service", () => {
  describe("goOnline", () => {
    it("transitions an offline driver to available", async () => {
      const driver = createDriverInState("offline", { name: "Jane" });
      const driverRepository = createFakeDriverRepository(driver);
      const locationService = createFakeLocationService();

      const service = createDriverManagementService({
        driverRepository,
        locationService,
      });

      const result = await service.goOnline(driver.id);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.driver.status).toBe("available");
      }
      expect(driverRepository.saved).toHaveLength(1);
      expect(driverRepository.saved[0]!.status).toBe("available");
    });

    it("returns failure when driver is not found", async () => {
      const driverRepository = createFakeDriverRepository(undefined);
      const locationService = createFakeLocationService();

      const service = createDriverManagementService({
        driverRepository,
        locationService,
      });

      const result = await service.goOnline("nonexistent-driver");

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Driver not found");
      }
    });
  });

  describe("goOffline", () => {
    it("transitions an available driver to offline", async () => {
      const driver = createDriverInState("available", { name: "Jane" });
      const driverRepository = createFakeDriverRepository(driver);
      const locationService = createFakeLocationService();

      const service = createDriverManagementService({
        driverRepository,
        locationService,
      });

      const result = await service.goOffline(driver.id);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.driver.status).toBe("offline");
      }
      expect(driverRepository.saved).toHaveLength(1);
      expect(driverRepository.saved[0]!.status).toBe("offline");
    });

    it("returns failure when driver is not found", async () => {
      const driverRepository = createFakeDriverRepository(undefined);
      const locationService = createFakeLocationService();

      const service = createDriverManagementService({
        driverRepository,
        locationService,
      });

      const result = await service.goOffline("nonexistent-driver");

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Driver not found");
      }
    });

    it("returns failure when driver is busy on a ride", async () => {
      const driver = createDriverInState("busy", {
        name: "Jane",
        rideId: "ride-1",
      });
      const driverRepository = createFakeDriverRepository(driver);
      const locationService = createFakeLocationService();

      const service = createDriverManagementService({
        driverRepository,
        locationService,
      });

      const result = await service.goOffline(driver.id);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Cannot go offline while on a ride");
      }
    });
  });

  describe("updateLocation", () => {
    it("updates driver location in repository and geo index", async () => {
      const driver = createDriverInState("available", { name: "Jane" });
      const newLocation = createValidLocation(34.0522, -118.2437);
      const driverRepository = createFakeDriverRepository(driver);
      const locationService = createFakeLocationService();

      const service = createDriverManagementService({
        driverRepository,
        locationService,
      });

      const result = await service.updateLocation(driver.id, newLocation);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.driver.location).toEqual(newLocation);
      }
      expect(driverRepository.saved).toHaveLength(1);
      expect(driverRepository.saved[0]!.location).toEqual(newLocation);
      expect(locationService.updates).toHaveLength(1);
      expect(locationService.updates[0]).toEqual({
        driverId: driver.id,
        location: newLocation,
      });
    });

    it("returns failure when driver is not found", async () => {
      const location = createValidLocation(34.0522, -118.2437);
      const driverRepository = createFakeDriverRepository(undefined);
      const locationService = createFakeLocationService();

      const service = createDriverManagementService({
        driverRepository,
        locationService,
      });

      const result = await service.updateLocation(
        "nonexistent-driver",
        location,
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Driver not found");
      }
    });
  });
});
