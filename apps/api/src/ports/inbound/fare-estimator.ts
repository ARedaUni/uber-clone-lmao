import type { Location } from "../../domain/location.js";
import type { FareCalculation } from "../../domain/fare.js";

export type FareEstimate = {
  readonly pickup: Location;
  readonly dropoff: Location;
  readonly distanceKm: number;
  readonly estimatedDurationMinutes: number;
  readonly fare: FareCalculation;
};

export type EstimateFareInput = {
  readonly pickup: Location;
  readonly dropoff: Location;
};

export interface FareEstimator {
  estimateFare(input: EstimateFareInput): Promise<FareEstimate>;
}
