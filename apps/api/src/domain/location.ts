export type Location = {
  readonly latitude: number;
  readonly longitude: number;
};

type LocationInput = {
  readonly latitude: number;
  readonly longitude: number;
};

type CreateLocationSuccess = {
  readonly success: true;
  readonly location: Location;
};

type CreateLocationFailure = {
  readonly success: false;
  readonly error: string;
};

type CreateLocationResult = CreateLocationSuccess | CreateLocationFailure;

export const createLocation = (input: LocationInput): CreateLocationResult => {
  if (input.latitude < -90 || input.latitude > 90) {
    return { success: false, error: "Latitude must be between -90 and 90" };
  }

  if (input.longitude < -180 || input.longitude > 180) {
    return { success: false, error: "Longitude must be between -180 and 180" };
  }

  return {
    success: true,
    location: {
      latitude: input.latitude,
      longitude: input.longitude,
    },
  };
};

const EARTH_RADIUS_KM = 6371;

const toRadians = (degrees: number): number => (degrees * Math.PI) / 180;

export const calculateDistanceKm = (from: Location, to: Location): number => {
  const lat1 = toRadians(from.latitude);
  const lat2 = toRadians(to.latitude);
  const deltaLat = toRadians(to.latitude - from.latitude);
  const deltaLng = toRadians(to.longitude - from.longitude);

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_KM * c;
};
