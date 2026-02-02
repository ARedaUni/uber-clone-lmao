import { describe, it, expect } from "vitest";
import { Hono } from "hono";
import type { DriverManager } from "../../../ports/inbound/driver-manager.js";
import type { DriverManagerResult } from "../../../ports/inbound/driver-manager.js";
import { createTestDriver } from "../../../domain/test-factories.js";
import { createDriversRouter } from "./drivers.js";

const successResult = (overrides?: Partial<{ status: string }>): DriverManagerResult => ({
  success: true,
  driver: {
    ...createTestDriver(),
    status: (overrides?.status ?? "available") as "available" | "offline" | "busy",
  },
});

const failureResult = (error: string): DriverManagerResult => ({
  success: false,
  error,
});

const createFakeDriverManager = (result: DriverManagerResult): DriverManager => ({
  goOnline: async () => result,
  goOffline: async () => result,
  updateLocation: async () => result,
});

const createApp = (driverManager: DriverManager) => {
  const app = new Hono();
  app.route("/drivers", createDriversRouter({ driverManager }));
  return app;
};

describe("drivers router", () => {
  describe("POST /drivers/online", () => {
    it("returns 200 with driver on success", async () => {
      const result = successResult({ status: "available" });
      const app = createApp(createFakeDriverManager(result));

      const response = await app.request("/drivers/online", {
        method: "POST",
        headers: { "X-Driver-Id": "driver-123" },
      });

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.driver.status).toBe("available");
    });

    it("returns 400 when port returns failure", async () => {
      const app = createApp(createFakeDriverManager(failureResult("Driver not found")));

      const response = await app.request("/drivers/online", {
        method: "POST",
        headers: { "X-Driver-Id": "driver-123" },
      });

      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({ error: "Driver not found" });
    });

    it("returns 401 when driver auth is missing", async () => {
      const app = createApp(createFakeDriverManager(successResult()));

      const response = await app.request("/drivers/online", { method: "POST" });

      expect(response.status).toBe(401);
    });
  });

  describe("POST /drivers/offline", () => {
    it("returns 200 with driver on success", async () => {
      const result = successResult({ status: "offline" });
      const app = createApp(createFakeDriverManager(result));

      const response = await app.request("/drivers/offline", {
        method: "POST",
        headers: { "X-Driver-Id": "driver-123" },
      });

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.driver.status).toBe("offline");
    });

    it("returns 401 when driver auth is missing", async () => {
      const app = createApp(createFakeDriverManager(successResult()));

      const response = await app.request("/drivers/offline", { method: "POST" });

      expect(response.status).toBe(401);
    });
  });

  describe("POST /drivers/location", () => {
    it("returns 200 with driver on valid location", async () => {
      const result = successResult();
      const app = createApp(createFakeDriverManager(result));

      const response = await app.request("/drivers/location", {
        method: "POST",
        headers: {
          "X-Driver-Id": "driver-123",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ latitude: 37.7749, longitude: -122.4194 }),
      });

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.driver).toBeDefined();
    });

    it("returns 400 for invalid latitude", async () => {
      const app = createApp(createFakeDriverManager(successResult()));

      const response = await app.request("/drivers/location", {
        method: "POST",
        headers: {
          "X-Driver-Id": "driver-123",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ latitude: 91, longitude: -122.4194 }),
      });

      expect(response.status).toBe(400);
    });

    it("returns 400 for invalid longitude", async () => {
      const app = createApp(createFakeDriverManager(successResult()));

      const response = await app.request("/drivers/location", {
        method: "POST",
        headers: {
          "X-Driver-Id": "driver-123",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ latitude: 37.7749, longitude: 181 }),
      });

      expect(response.status).toBe(400);
    });

    it("returns 400 for missing fields", async () => {
      const app = createApp(createFakeDriverManager(successResult()));

      const response = await app.request("/drivers/location", {
        method: "POST",
        headers: {
          "X-Driver-Id": "driver-123",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });

      expect(response.status).toBe(400);
    });

    it("returns 401 when driver auth is missing", async () => {
      const app = createApp(createFakeDriverManager(successResult()));

      const response = await app.request("/drivers/location", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ latitude: 37.7749, longitude: -122.4194 }),
      });

      expect(response.status).toBe(401);
    });
  });

  describe("port delegation", () => {
    it("passes driverId from auth to goOnline", async () => {
      const calls: string[] = [];
      const driverManager: DriverManager = {
        goOnline: async (driverId) => {
          calls.push(driverId);
          return successResult();
        },
        goOffline: async () => successResult(),
        updateLocation: async () => successResult(),
      };
      const app = createApp(driverManager);

      await app.request("/drivers/online", {
        method: "POST",
        headers: { "X-Driver-Id": "driver-abc" },
      });

      expect(calls).toEqual(["driver-abc"]);
    });

    it("passes driverId and location to updateLocation", async () => {
      const calls: Array<{ driverId: string; latitude: number; longitude: number }> = [];
      const driverManager: DriverManager = {
        goOnline: async () => successResult(),
        goOffline: async () => successResult(),
        updateLocation: async (driverId, location) => {
          calls.push({ driverId, latitude: location.latitude, longitude: location.longitude });
          return successResult();
        },
      };
      const app = createApp(driverManager);

      await app.request("/drivers/location", {
        method: "POST",
        headers: {
          "X-Driver-Id": "driver-xyz",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ latitude: 34.0522, longitude: -118.2437 }),
      });

      expect(calls).toEqual([
        { driverId: "driver-xyz", latitude: 34.0522, longitude: -118.2437 },
      ]);
    });
  });
});
