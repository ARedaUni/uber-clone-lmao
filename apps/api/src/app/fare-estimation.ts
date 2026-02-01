import type { FareConfig } from "../domain/fare.js";
import { calculateFare } from "../domain/fare.js";
import { calculateDistanceKm } from "../domain/location.js";
import type { FareEstimator } from "../ports/inbound/fare-estimator.js";

const AVERAGE_SPEED_KM_PER_HOUR = 30;

type FareEstimationDependencies = {
  readonly config: FareConfig;
};

export const createFareEstimationService = (deps: FareEstimationDependencies): FareEstimator => ({
  estimateFare: async (input) => {
    const distanceKm = calculateDistanceKm(input.pickup, input.dropoff);
    const estimatedDurationMinutes = (distanceKm / AVERAGE_SPEED_KM_PER_HOUR) * 60;

    const fare = calculateFare({
      distanceKm,
      durationMinutes: estimatedDurationMinutes,
      config: deps.config,
    });

    return {
      pickup: input.pickup,
      dropoff: input.dropoff,
      distanceKm,
      estimatedDurationMinutes,
      fare,
    };
  },
});
