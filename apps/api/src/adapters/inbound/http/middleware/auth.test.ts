import { describe, it, expect } from "vitest";
import { Hono } from "hono";
import {
  createAuthMiddleware,
  type DriverAuthEnv,
  type RiderAuthEnv,
} from "./auth.js";

describe("auth middleware", () => {
  describe("driverAuth", () => {
    const createApp = () => {
      const auth = createAuthMiddleware();
      const app = new Hono<DriverAuthEnv>();
      app.use("/*", auth.driverAuth);
      app.get("/test", (c) => c.json({ driverId: c.get("driverId") }));
      return app;
    };

    it("sets driverId from X-Driver-Id header", async () => {
      const app = createApp();

      const response = await app.request("/test", {
        headers: { "X-Driver-Id": "driver-123" },
      });

      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({ driverId: "driver-123" });
    });

    it("returns 401 when X-Driver-Id header is missing", async () => {
      const app = createApp();

      const response = await app.request("/test");

      expect(response.status).toBe(401);
      expect(await response.json()).toEqual({
        error: "Missing driver authentication",
      });
    });
  });

  describe("riderAuth", () => {
    const createApp = () => {
      const auth = createAuthMiddleware();
      const app = new Hono<RiderAuthEnv>();
      app.use("/*", auth.riderAuth);
      app.get("/test", (c) => c.json({ riderId: c.get("riderId") }));
      return app;
    };

    it("sets riderId from X-Rider-Id header", async () => {
      const app = createApp();

      const response = await app.request("/test", {
        headers: { "X-Rider-Id": "rider-456" },
      });

      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({ riderId: "rider-456" });
    });

    it("returns 401 when X-Rider-Id header is missing", async () => {
      const app = createApp();

      const response = await app.request("/test");

      expect(response.status).toBe(401);
      expect(await response.json()).toEqual({
        error: "Missing rider authentication",
      });
    });
  });
});
