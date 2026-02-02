import { createMiddleware } from "hono/factory";

export type DriverAuthEnv = { Variables: { driverId: string } };
export type RiderAuthEnv = { Variables: { riderId: string } };

export const createAuthMiddleware = () => ({
  driverAuth: createMiddleware<DriverAuthEnv>(async (c, next) => {
    const driverId = c.req.header("X-Driver-Id");
    if (!driverId) {
      return c.json({ error: "Missing driver authentication" }, 401);
    }
    c.set("driverId", driverId);
    await next();
  }),

  riderAuth: createMiddleware<RiderAuthEnv>(async (c, next) => {
    const riderId = c.req.header("X-Rider-Id");
    if (!riderId) {
      return c.json({ error: "Missing rider authentication" }, 401);
    }
    c.set("riderId", riderId);
    await next();
  }),
});
