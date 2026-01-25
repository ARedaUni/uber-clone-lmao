export type FareConfig = {
  readonly baseFare: number;
  readonly perKmRate: number;
  readonly perMinuteRate: number;
  readonly minimumFare: number;
};

export type FareBreakdown = {
  readonly base: number;
  readonly distance: number;
  readonly time: number;
};

export type FareCalculation = {
  readonly breakdown: FareBreakdown;
  readonly total: number;
  readonly surgeMultiplier: number;
};

type CalculateFareInput = {
  readonly distanceKm: number;
  readonly durationMinutes: number;
  readonly config: FareConfig;
  readonly surgeMultiplier?: number;
};

export const calculateFare = (input: CalculateFareInput): FareCalculation => {
  const surge = input.surgeMultiplier ?? 1.0;

  const breakdown: FareBreakdown = {
    base: input.config.baseFare,
    distance: input.distanceKm * input.config.perKmRate,
    time: input.durationMinutes * input.config.perMinuteRate,
  };

  const subtotal = breakdown.base + breakdown.distance + breakdown.time;
  const withSurge = subtotal * surge;
  const total = Math.max(withSurge, input.config.minimumFare);

  return {
    breakdown,
    total,
    surgeMultiplier: surge,
  };
};
