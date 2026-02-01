import type { Ride } from "../domain/ride.js";
import type { RideRepository } from "../ports/outbound/ride-repository.js";
import type { QueueService } from "../ports/outbound/queue-service.js";
import { createRideCreationService } from "./ride-creation.js";

const createFakeRideRepository = () => {
  const saved: Ride[] = [];
  const repository: RideRepository & { readonly saved: Ride[] } = {
    save: async (ride: Ride) => {
      saved.push(ride);
    },
    findById: async () => undefined,
    findByRiderId: async () => [],
    findByStatus: async () => [],
    saved,
  };
  return repository;
};

const createFakeQueueService = () => {
  const enqueued: Array<{ readonly queueName: string; readonly data: unknown }> = [];
  const service: QueueService & { readonly enqueued: typeof enqueued } = {
    enqueue: async <T>(queueName: string, data: T) => {
      enqueued.push({ queueName, data });
    },
    enqueued,
  };
  return service;
};

describe("ride creation service", () => {
  const pickup = { latitude: 37.7749, longitude: -122.4194 };
  const dropoff = { latitude: 37.3382, longitude: -121.8863 };

  it("creates a ride and saves it to the repository", async () => {
    const rideRepository = createFakeRideRepository();
    const queueService = createFakeQueueService();
    const service = createRideCreationService({ rideRepository, queueService });

    const result = await service.requestRide({
      riderId: "rider-1",
      pickup,
      dropoff,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.ride.riderId).toBe("rider-1");
      expect(result.ride.status).toBe("requested");
    }
    expect(rideRepository.saved).toHaveLength(1);
  });

  it("enqueues the ride for driver matching", async () => {
    const rideRepository = createFakeRideRepository();
    const queueService = createFakeQueueService();
    const service = createRideCreationService({ rideRepository, queueService });

    const result = await service.requestRide({
      riderId: "rider-1",
      pickup,
      dropoff,
    });

    expect(queueService.enqueued).toHaveLength(1);
    const enqueued = queueService.enqueued[0]!;
    expect(enqueued.queueName).toBe("driver-matching");
    if (result.success) {
      expect(enqueued.data).toEqual({ rideId: result.ride.id });
    }
  });

  it("returns the created ride with pickup and dropoff locations", async () => {
    const rideRepository = createFakeRideRepository();
    const queueService = createFakeQueueService();
    const service = createRideCreationService({ rideRepository, queueService });

    const result = await service.requestRide({ riderId: "rider-1", pickup, dropoff });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.ride.pickup).toEqual(pickup);
      expect(result.ride.dropoff).toEqual(dropoff);
      expect(result.ride.id).toBeDefined();
    }
  });
});
