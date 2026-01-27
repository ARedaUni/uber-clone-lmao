import { describe, it, expect } from "vitest";
import { createDriver } from "./driver.js";
import { createValidLocation } from "./test-factories.js";

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
  });
});
