export type MatchDriverSuccess = {
  readonly success: true;
  readonly driverId: string;
};

export type MatchDriverFailure = {
  readonly success: false;
  readonly reason: string;
};

export type MatchDriverResult = MatchDriverSuccess | MatchDriverFailure;

export interface DriverMatcher {
  matchDriver(rideId: string): Promise<MatchDriverResult>;
}
