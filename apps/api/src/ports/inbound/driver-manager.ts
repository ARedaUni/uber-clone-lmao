import type { Driver } from "../../domain/driver.js";
import type { Location } from "../../domain/location.js";

export type DriverManagerSuccess = {
  readonly success: true;
  readonly driver: Driver;
};

export type DriverManagerFailure = {
  readonly success: false;
  readonly error: string;
};

export type DriverManagerResult = DriverManagerSuccess | DriverManagerFailure;

export interface DriverManager {
  goOnline(driverId: string): Promise<DriverManagerResult>;
  goOffline(driverId: string): Promise<DriverManagerResult>;
  updateLocation(driverId: string, location: Location): Promise<DriverManagerResult>;
}
