import { createRide } from "../domain/ride.js";
import type { RideRequester } from "../ports/inbound/ride-requester.js";
import type { RideRepository } from "../ports/outbound/ride-repository.js";
import type { QueueService } from "../ports/outbound/queue-service.js";

type RideCreationDependencies = {
  readonly rideRepository: RideRepository;
  readonly queueService: QueueService;
};

export const createRideCreationService = (deps: RideCreationDependencies): RideRequester => ({
  requestRide: async (input) => {
    const result = createRide(input);

    if (!result.success) {
      return { success: false, error: result.error };
    }

    await deps.rideRepository.save(result.ride);
    await deps.queueService.enqueue("driver-matching", { rideId: result.ride.id });

    return { success: true, ride: result.ride };
  },
});
