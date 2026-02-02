import { describe, it, expect } from "vitest";
import { Hono } from "hono";
import type { FareEstimator, FareEstimate } from "../../../ports/inbound/fare-estimator.js";
import { createValidLocation } from "../../../domain/test-factories.js";
import { createFaresRouter } from "./fares.js";

const createFakeEstimate = (): FareEstimate => ({
  pickup: createValidLocation(37.7749, -122.4194),
  dropoff: createValidLocation(34.0522, -118.2437),
  distanceKm: 559,
  estimatedDurationMinutes: 330,
  fare: {
    breakdown: { base: 5, distance: 559, time: 66 },
    total: 630,
    surgeMultiplier: 1.0,
  },
});

const createFakeFareEstimator = (estimate: FareEstimate): FareEstimator => ({
  estimateFare: async () => estimate,
});

const createApp = (fareEstimator: FareEstimator) => {
  const app = new Hono();
  app.route("/fares", createFaresRouter({ fareEstimator }));
  return app;
};

describe("fares router", () => {
  describe("POST /fares/estimate", () => {
    it("returns 200 with fare estimate on valid input", async () => {
      const estimate = createFakeEstimate();
      const app = createApp(createFakeFareEstimator(estimate));

      const response = await app.request("/fares/estimate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pickup: { latitude: 37.7749, longitude: -122.4194 },
          dropoff: { latitude: 34.0522, longitude: -118.2437 },
        }),
      });

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.distanceKm).toBe(559);
      expect(body.fare.total).toBe(630);
    });

    it("returns 400 for invalid pickup latitude", async () => {
      const app = createApp(createFakeFareEstimator(createFakeEstimate()));

      const response = await app.request("/fares/estimate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pickup: { latitude: 91, longitude: -122.4194 },
          dropoff: { latitude: 34.0522, longitude: -118.2437 },
        }),
      });

      expect(response.status).toBe(400);
    });

    it("returns 400 for invalid dropoff longitude", async () => {
      const app = createApp(createFakeFareEstimator(createFakeEstimate()));

      const response = await app.request("/fares/estimate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pickup: { latitude: 37.7749, longitude: -122.4194 },
          dropoff: { latitude: 34.0522, longitude: 181 },
        }),
      });

      expect(response.status).toBe(400);
    });

    it("returns 400 when pickup is missing", async () => {
      const app = createApp(createFakeFareEstimator(createFakeEstimate()));

      const response = await app.request("/fares/estimate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dropoff: { latitude: 34.0522, longitude: -118.2437 },
        }),
      });

      expect(response.status).toBe(400);
    });

    it("returns 400 when dropoff is missing", async () => {
      const app = createApp(createFakeFareEstimator(createFakeEstimate()));

      const response = await app.request("/fares/estimate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pickup: { latitude: 37.7749, longitude: -122.4194 },
        }),
      });

      expect(response.status).toBe(400);
    });

    it("does not require authentication", async () => {
      const app = createApp(createFakeFareEstimator(createFakeEstimate()));

      const response = await app.request("/fares/estimate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pickup: { latitude: 37.7749, longitude: -122.4194 },
          dropoff: { latitude: 34.0522, longitude: -118.2437 },
        }),
      });

      expect(response.status).toBe(200);
    });
  });

  describe("port delegation", () => {
    it("passes pickup and dropoff to estimateFare", async () => {
      const calls: Array<{ pickup: { latitude: number; longitude: number }; dropoff: { latitude: number; longitude: number } }> = [];
      const fareEstimator: FareEstimator = {
        estimateFare: async (input) => {
          calls.push({ pickup: input.pickup, dropoff: input.dropoff });
          return createFakeEstimate();
        },
      };
      const app = createApp(fareEstimator);

      await app.request("/fares/estimate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pickup: { latitude: 37.7749, longitude: -122.4194 },
          dropoff: { latitude: 34.0522, longitude: -118.2437 },
        }),
      });

      expect(calls).toEqual([
        {
          pickup: { latitude: 37.7749, longitude: -122.4194 },
          dropoff: { latitude: 34.0522, longitude: -118.2437 },
        },
      ]);
    });
  });
});
