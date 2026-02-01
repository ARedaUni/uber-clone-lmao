import type { FareConfig } from "../domain/fare.js";
import { createFareEstimationService } from "./fare-estimation.js";

describe("fare estimation service", () => {
  const config: FareConfig = {
    baseFare: 5,
    perKmRate: 2,
    perMinuteRate: 0.5,
    minimumFare: 10,
  };

  const sf = { latitude: 37.7749, longitude: -122.4194 };
  const sanJose = { latitude: 37.3382, longitude: -121.8863 };

  it("returns fare estimate for given pickup and dropoff", async () => {
    const service = createFareEstimationService({ config });

    const result = await service.estimateFare({ pickup: sf, dropoff: sanJose });

    expect(result.pickup).toEqual(sf);
    expect(result.dropoff).toEqual(sanJose);
    expect(result.distanceKm).toBeGreaterThan(0);
    expect(result.estimatedDurationMinutes).toBeGreaterThan(0);
    expect(result.fare.total).toBeGreaterThan(0);
    expect(result.fare.surgeMultiplier).toBe(1.0);
  });

  it("calculates distance and duration from pickup to dropoff", async () => {
    const service = createFareEstimationService({ config });

    const result = await service.estimateFare({ pickup: sf, dropoff: sanJose });

    expect(result.distanceKm).toBeCloseTo(67.6, 0);
    // ~67.6 km / 30 km/h * 60 = ~135.1 minutes
    expect(result.estimatedDurationMinutes).toBeCloseTo(135.1, 0);
  });
});
