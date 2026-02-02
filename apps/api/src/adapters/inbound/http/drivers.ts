import { Hono } from "hono";
import type { DriverManager } from "../../../ports/inbound/driver-manager.js";
import { createAuthMiddleware, type DriverAuthEnv } from "./middleware/auth.js";
import { locationSchema } from "./schemas.js";

type DriversRouterDeps = {
  readonly driverManager: DriverManager;
};

export const createDriversRouter = ({ driverManager }: DriversRouterDeps) => {
  const router = new Hono<DriverAuthEnv>();
  const { driverAuth } = createAuthMiddleware();

  router.use("/*", driverAuth);

  router.post("/online", async (c) => {
    const driverId = c.get("driverId");
    const result = await driverManager.goOnline(driverId);
    if (!result.success) {
      return c.json({ error: result.error }, 400);
    }
    return c.json({ driver: result.driver });
  });

  router.post("/offline", async (c) => {
    const driverId = c.get("driverId");
    const result = await driverManager.goOffline(driverId);
    if (!result.success) {
      return c.json({ error: result.error }, 400);
    }
    return c.json({ driver: result.driver });
  });

  router.post("/location", async (c) => {
    const driverId = c.get("driverId");
    const body = await c.req.json();
    const parsed = locationSchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ error: parsed.error.issues }, 400);
    }
    const result = await driverManager.updateLocation(driverId, parsed.data);
    if (!result.success) {
      return c.json({ error: result.error }, 400);
    }
    return c.json({ driver: result.driver });
  });

  return router;
};
