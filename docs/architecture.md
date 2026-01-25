# Hexagonal Architecture in Uberclone

## Overview

Uberclone uses hexagonal architecture (ports & adapters pattern) to maintain clear separation between business logic and infrastructure concerns. The core domain has zero framework dependencies and communicates through well-defined interfaces.

## Structure

```
┌──────────────────────────────────────────────────┐
│                   Clients                         │
│            (Mobile Apps, Web)                     │
└──────────────┬───────────────────────────────────┘
               │ HTTP requests
               ↓
┌──────────────────────────────────────────────────┐
│         Inbound Adapters (Hono Routes)            │
│  - HTTP controllers                               │
│  - Request validation                             │
│  - Response formatting                            │
└──────────────┬───────────────────────────────────┘
               │ calls
               ↓
┌──────────────────────────────────────────────────┐
│         Application Services (app/)               │
│  - Use case orchestration                         │
│  - Transaction boundaries                         │
│  - Cross-cutting concerns                         │
└──────────────┬───────────────────────────────────┘
               │ uses
               ↓
┌──────────────────────────────────────────────────┐
│              Domain (domain/)                     │
│  - Pure TypeScript business logic                 │
│  - Entities: Rider, Driver, Fare, Ride, Location  │
│  - No external dependencies                       │
└──────────────┬───────────────────────────────────┘
               │ defines
               ↓
┌──────────────────────────────────────────────────┐
│              Ports (ports/)                       │
│  - RiderRepository                                │
│  - DriverRepository                               │
│  - RideRepository                                 │
│  - LocationService                                │
│  - LockService                                    │
│  - QueueService                                   │
└──────────────┬───────────────────────────────────┘
               │ implemented by
               ↓
┌──────────────────────────────────────────────────┐
│         Outbound Adapters (adapters/outbound/)    │
│  - PostgresRiderRepository                        │
│  - PostgresDriverRepository                       │
│  - RedisLocationService                           │
│  - RedisLockService                               │
│  - BullMQQueueService                             │
└──────────────────────────────────────────────────┘
```

## Directory Structure

```
apps/api/src/
├── domain/              # Pure business logic, entities
│   ├── rider.ts         # Rider entity and business rules
│   ├── driver.ts        # Driver entity and business rules
│   ├── fare.ts          # Fare calculation logic
│   ├── ride.ts          # Ride entity and state machine
│   └── location.ts      # Location value object
├── ports/               # Interfaces (behavior contracts)
│   ├── inbound/         # Ports that drive the domain
│   │   ├── fare-estimator.ts
│   │   ├── ride-requester.ts
│   │   └── driver-matcher.ts
│   └── outbound/        # Ports driven by the domain
│       ├── rider-repository.ts
│       ├── driver-repository.ts
│       ├── ride-repository.ts
│       ├── location-service.ts
│       ├── lock-service.ts
│       └── queue-service.ts
├── adapters/
│   ├── inbound/         # HTTP controllers (Hono routes)
│   │   ├── health.ts
│   │   ├── fares.ts
│   │   ├── rides.ts
│   │   └── drivers.ts
│   └── outbound/        # Infrastructure implementations
│       ├── postgres-rider-repository.ts
│       ├── postgres-driver-repository.ts
│       ├── postgres-ride-repository.ts
│       ├── redis-location-service.ts
│       ├── redis-lock-service.ts
│       └── bullmq-queue-service.ts
└── app/                 # Application services (orchestration)
    ├── fare-estimation.ts
    ├── ride-creation.ts
    └── driver-matching.ts
```

## Key Principles

### 1. Dependency Direction

Dependencies flow INWARD only:

- Adapters depend on Ports (interfaces) and Application Services
- Application Services depend on Domain and Ports
- Domain depends on nothing
- Ports are pure interfaces with no dependencies

```
Adapters → Application → Domain
              ↓
            Ports (interfaces only)
```

### 2. Port Definition

**Use `interface` for ports (behavior contracts):**

```typescript
// ports/outbound/rider-repository.ts
export interface RiderRepository {
  findById(id: string): Promise<Rider | undefined>;
  save(rider: Rider): Promise<void>;
}

// ports/outbound/location-service.ts
export interface LocationService {
  updateDriverLocation(driverId: string, location: Location): Promise<void>;
  findNearbyDrivers(location: Location, radiusKm: number): Promise<DriverLocation[]>;
}

// ports/outbound/lock-service.ts
export interface LockService {
  acquireLock(key: string, ttlMs: number): Promise<boolean>;
  releaseLock(key: string): Promise<void>;
}
```

**Use `type` for data structures:**

```typescript
// domain/location.ts
export type Location = {
  readonly latitude: number;
  readonly longitude: number;
};

// domain/ride.ts
export type RideStatus =
  | 'requested'
  | 'driver_assigned'
  | 'driver_en_route'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export type Ride = {
  readonly id: string;
  readonly riderId: string;
  readonly driverId?: string;
  readonly pickup: Location;
  readonly destination: Location;
  readonly status: RideStatus;
  readonly fareEstimate: number;
  readonly requestedAt: Date;
};
```

### 3. Dependency Injection

Domain and application logic NEVER create implementations. All ports are injected:

```typescript
// app/driver-matching.ts
export type DriverMatchingDependencies = {
  readonly driverRepository: DriverRepository;
  readonly locationService: LocationService;
  readonly lockService: LockService;
  readonly rideRepository: RideRepository;
};

export const createDriverMatcher = (deps: DriverMatchingDependencies) => {
  return {
    matchDriver: async (rideId: string): Promise<MatchResult> => {
      const ride = await deps.rideRepository.findById(rideId);
      if (!ride) return { success: false, reason: 'ride_not_found' };

      const nearbyDrivers = await deps.locationService.findNearbyDrivers(
        ride.pickup,
        5 // 5km radius
      );

      for (const driver of nearbyDrivers) {
        const lockAcquired = await deps.lockService.acquireLock(
          `driver:${driver.id}`,
          30000 // 30 second lock
        );

        if (lockAcquired) {
          // Assign driver to ride
          await deps.rideRepository.assignDriver(rideId, driver.id);
          return { success: true, driverId: driver.id };
        }
      }

      return { success: false, reason: 'no_available_drivers' };
    },
  };
};
```

### 4. Adapter Responsibilities

**Inbound Adapters** translate HTTP requests to application calls:

```typescript
// adapters/inbound/rides.ts
import { Hono } from 'hono';
import type { RideRequester } from '../../ports/inbound/ride-requester';

export const createRidesRouter = (rideRequester: RideRequester) => {
  const router = new Hono();

  router.post('/', async (c) => {
    const body = await c.req.json();
    // Validate request body with schema
    const result = await rideRequester.requestRide({
      riderId: body.riderId,
      pickup: body.pickup,
      destination: body.destination,
      fareEstimateId: body.fareEstimateId,
    });

    if (!result.success) {
      return c.json({ error: result.reason }, 400);
    }

    return c.json({ rideId: result.rideId }, 201);
  });

  return router;
};
```

**Outbound Adapters** implement ports with specific technologies:

```typescript
// adapters/outbound/redis-location-service.ts
import type { Redis } from 'ioredis';
import type { LocationService } from '../../ports/outbound/location-service';
import type { Location, DriverLocation } from '../../domain/location';

export const createRedisLocationService = (redis: Redis): LocationService => ({
  updateDriverLocation: async (driverId, location) => {
    await redis.geoadd(
      'driver:locations',
      location.longitude,
      location.latitude,
      driverId
    );
  },

  findNearbyDrivers: async (location, radiusKm) => {
    const results = await redis.georadius(
      'driver:locations',
      location.longitude,
      location.latitude,
      radiusKm,
      'km',
      'WITHDIST',
      'ASC'
    );

    return results.map(([driverId, distance]) => ({
      driverId,
      distanceKm: parseFloat(distance),
    }));
  },
});
```

## Infrastructure

### PostgreSQL (Relational Data)

Stores persistent business data:
- Riders and their profiles
- Drivers and vehicle information
- Rides and their state history
- Fare estimates and calculations

### Redis (Geospatial + Cache + Locks)

Handles real-time operational data:
- **Geospatial**: Driver location tracking with `GEOADD`/`GEORADIUS`
- **Distributed Locks**: Prevent race conditions in driver matching
- **Cache**: Session data, frequently accessed lookups

### BullMQ (Async Processing)

Handles high-throughput ride requests:
- Queue ride requests during peak load
- Retry failed matching attempts
- Handle timeouts gracefully

## Benefits

### 1. Testability

Domain and application logic can be tested with simple in-memory implementations:

```typescript
// In tests
const mockLocationService: LocationService = {
  updateDriverLocation: vi.fn(),
  findNearbyDrivers: vi.fn().mockResolvedValue([
    { driverId: 'driver-1', distanceKm: 0.5 },
  ]),
};

const matcher = createDriverMatcher({
  driverRepository: mockDriverRepository,
  locationService: mockLocationService,
  lockService: mockLockService,
  rideRepository: mockRideRepository,
});

// Test pure business logic without Redis, Postgres, etc.
```

### 2. Swappable Implementations

Change infrastructure without touching business logic:

```typescript
// Development: In-memory implementations
const locationService = createInMemoryLocationService();

// Production: Redis implementation
const locationService = createRedisLocationService(redisClient);

// Both satisfy the same LocationService interface
```

### 3. Clear Boundaries

Each layer has specific responsibilities:

| Layer | Responsibility | Example |
|-------|---------------|---------|
| Domain | Business rules | "A ride cannot be cancelled after pickup" |
| Ports | Contracts | "LocationService must support findNearbyDrivers" |
| Application | Orchestration | "Match driver, then update ride, then notify" |
| Adapters | Translation | "Convert HTTP request to domain call" |

### 4. Framework Independence

Core logic works with any framework. Swap Hono for Express, Fastify, or others by changing only the inbound adapters.

## Anti-Patterns to Avoid

### Domain Importing Adapters

```typescript
// domain/ride.ts
import { prisma } from '../adapters/outbound/prisma'; // WRONG
```

Domain should never know about specific implementations.

### Creating Implementations in Application Services

```typescript
// app/driver-matching.ts
import Redis from 'ioredis';

export const createDriverMatcher = () => {
  const redis = new Redis(); // WRONG - creating infrastructure
  // ...
};
```

Always inject dependencies.

### Business Logic in Adapters

```typescript
// adapters/inbound/rides.ts
router.post('/', async (c) => {
  // WRONG - business rule in adapter
  if (ride.status !== 'requested') {
    return c.json({ error: 'Cannot cancel' }, 400);
  }
});
```

Business rules belong in the domain layer.

### Infrastructure Details in Domain

```typescript
// domain/driver.ts
export const findNearbyDrivers = async (lat: number, lng: number) => {
  // WRONG - Redis-specific command in domain
  return redis.georadius('drivers', lng, lat, 5, 'km');
};
```

Domain defines what it needs (via ports), adapters provide how.

## See Also

- [architecture.md](../architecture.md) - Project overview and tech stack
- [Learning Path](../architecture.md#learning-path) - Step-by-step implementation guide
