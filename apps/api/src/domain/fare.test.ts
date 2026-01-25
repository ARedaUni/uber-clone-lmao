import { describe, it, expect } from "vitest";
import { calculateFare, type FareConfig } from "./fare.js";

describe("Fare", () => {
  const defaultConfig: FareConfig = {
    baseFare: 2.5,
    perKmRate: 1.5,
    perMinuteRate: 0.25,
    minimumFare: 5.0,
  };

  describe("calculateFare", () => {
    it("calculates fare from distance and duration", () => {
      const result = calculateFare({
        distanceKm: 10,
        durationMinutes: 20,
        config: defaultConfig,
      });

      // base (2.5) + distance (10 * 1.5 = 15) + time (20 * 0.25 = 5) = 22.5
      expect(result.total).toBe(22.5);
      expect(result.breakdown.base).toBe(2.5);
      expect(result.breakdown.distance).toBe(15);
      expect(result.breakdown.time).toBe(5);
    });

    it("applies surge pricing multiplier", () => {
      const result = calculateFare({
        distanceKm: 10,
        durationMinutes: 20,
        config: defaultConfig,
        surgeMultiplier: 2.0,
      });

      // (2.5 + 15 + 5) * 2.0 = 45
      expect(result.total).toBe(45);
      expect(result.surgeMultiplier).toBe(2.0);
    });

    it("defaults surge multiplier to 1.0", () => {
      const result = calculateFare({
        distanceKm: 10,
        durationMinutes: 20,
        config: defaultConfig,
      });

      expect(result.surgeMultiplier).toBe(1.0);
    });

    it("enforces minimum fare", () => {
      const result = calculateFare({
        distanceKm: 0.5,
        durationMinutes: 2,
        config: defaultConfig,
      });

      // base (2.5) + distance (0.5 * 1.5 = 0.75) + time (2 * 0.25 = 0.5) = 3.75
      // But minimum is 5.0
      expect(result.total).toBe(5.0);
    });

    it("does not apply minimum fare when calculated fare exceeds it", () => {
      const result = calculateFare({
        distanceKm: 10,
        durationMinutes: 20,
        config: defaultConfig,
      });

      // 22.5 > 5.0, so no minimum applied
      expect(result.total).toBe(22.5);
    });

    it("applies surge before minimum fare check", () => {
      const result = calculateFare({
        distanceKm: 0.5,
        durationMinutes: 2,
        config: defaultConfig,
        surgeMultiplier: 0.5,
      });

      // (2.5 + 0.75 + 0.5) * 0.5 = 1.875, but minimum is 5.0
      expect(result.total).toBe(5.0);
    });

    it("returns breakdown with all components", () => {
      const result = calculateFare({
        distanceKm: 5,
        durationMinutes: 10,
        config: defaultConfig,
      });

      expect(result.breakdown).toEqual({
        base: 2.5,
        distance: 7.5,
        time: 2.5,
      });
    });

    it("handles zero distance and duration", () => {
      const result = calculateFare({
        distanceKm: 0,
        durationMinutes: 0,
        config: defaultConfig,
      });

      // base (2.5) + 0 + 0 = 2.5, but minimum is 5.0
      expect(result.total).toBe(5.0);
      expect(result.breakdown.base).toBe(2.5);
      expect(result.breakdown.distance).toBe(0);
      expect(result.breakdown.time).toBe(0);
    });
  });
});
