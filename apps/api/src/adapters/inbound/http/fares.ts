import { Hono } from "hono";
import { z } from "zod";
import type { FareEstimator } from "../../../ports/inbound/fare-estimator.js";
import { locationSchema } from "./schemas.js";

const estimateFareSchema = z.object({
  pickup: locationSchema,
  dropoff: locationSchema,
});

type FaresRouterDeps = {
  readonly fareEstimator: FareEstimator;
};

export const createFaresRouter = ({ fareEstimator }: FaresRouterDeps) => {
  const router = new Hono();

  router.post("/estimate", async (c) => {
    const body = await c.req.json();
    const parsed = estimateFareSchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ error: parsed.error.issues }, 400);
    }
    const estimate = await fareEstimator.estimateFare(parsed.data);
    return c.json(estimate);
  });

  return router;
};
