import { describe, it, expect } from "vitest";
import { createLocation, calculateDistanceKm } from "./location.js";
import { createValidLocation } from "./test-factories.js";

describe("Location", () => {
  describe("createLocation", () => {
    it("creates a location with valid coordinates", () => {
      const result = createLocation({ latitude: 37.7749, longitude: -122.4194 });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.location.latitude).toBe(37.7749);
        expect(result.location.longitude).toBe(-122.4194);
      }
    });

    it("rejects latitude below -90", () => {
      const result = createLocation({ latitude: -91, longitude: 0 });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Latitude must be between -90 and 90");
      }
    });

    it("rejects latitude above 90", () => {
      const result = createLocation({ latitude: 91, longitude: 0 });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Latitude must be between -90 and 90");
      }
    });

    it("rejects longitude below -180", () => {
      const result = createLocation({ latitude: 0, longitude: -181 });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Longitude must be between -180 and 180");
      }
    });

    it("rejects longitude above 180", () => {
      const result = createLocation({ latitude: 0, longitude: 181 });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Longitude must be between -180 and 180");
      }
    });

    it("accepts boundary values", () => {
      const north = createLocation({ latitude: 90, longitude: 0 });
      const south = createLocation({ latitude: -90, longitude: 0 });
      const east = createLocation({ latitude: 0, longitude: 180 });
      const west = createLocation({ latitude: 0, longitude: -180 });

      expect(north.success).toBe(true);
      expect(south.success).toBe(true);
      expect(east.success).toBe(true);
      expect(west.success).toBe(true);
    });
  });

  describe("calculateDistanceKm", () => {
    it("returns 0 for same location", () => {
      const location = createValidLocation(37.7749, -122.4194);

      const distance = calculateDistanceKm(location, location);

      expect(distance).toBe(0);
    });

    it("calculates distance between San Francisco and Los Angeles", () => {
      const sf = createValidLocation(37.7749, -122.4194);
      const la = createValidLocation(34.0522, -118.2437);

      const distance = calculateDistanceKm(sf, la);

      // Known distance is approximately 559 km
      expect(distance).toBeGreaterThan(550);
      expect(distance).toBeLessThan(570);
    });

    it("calculates distance between New York and London", () => {
      const nyc = createValidLocation(40.7128, -74.006);
      const london = createValidLocation(51.5074, -0.1278);

      const distance = calculateDistanceKm(nyc, london);

      // Known distance is approximately 5,570 km
      expect(distance).toBeGreaterThan(5500);
      expect(distance).toBeLessThan(5600);
    });

    it("is symmetric (A to B equals B to A)", () => {
      const sf = createValidLocation(37.7749, -122.4194);
      const la = createValidLocation(34.0522, -118.2437);

      const distanceAtoB = calculateDistanceKm(sf, la);
      const distanceBtoA = calculateDistanceKm(la, sf);

      expect(distanceAtoB).toBe(distanceBtoA);
    });
  });
});
