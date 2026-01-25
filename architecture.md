# Uber Clone - System Design Practice

A backend implementation of an Uber-like ride-sharing platform, built to learn system design through practice.

## Goals

Learn system design concepts by implementing:

- **Hexagonal Architecture** - Ports and adapters for testability and flexibility
- **Geospatial Queries** - Real-time driver location tracking and proximity search
- **Distributed Locking** - Preventing race conditions in driver matching
- **Async Processing** - Handling high-throughput ride requests
- **State Machines** - Managing ride lifecycle

## Functional Requirements

| Requirement | Description |
|-------------|-------------|
| Fare Estimation | Riders input pickup + destination, get fare estimate |
| Ride Request | Riders request a ride based on estimated fare |
| Driver Matching | Match riders with nearby available drivers |
| Accept/Decline | Drivers accept or decline ride requests |

## Non-Functional Requirements

| Requirement | Target |
|-------------|--------|
| Matching Latency | < 1 minute to match or fail |
| Consistency | No driver assigned multiple rides simultaneously |
| Throughput | Handle 100k requests from same location (peak hours) |

## Tech Stack

| Component | Technology | Purpose |
|-----------|------------|---------|
| Language | TypeScript (strict) | Type safety |
| Runtime | Node.js | Backend execution |
| HTTP | Hono | Lightweight, fast API framework |
| ORM | Prisma | Database access, migrations |
| Main Database | PostgreSQL | Riders, drivers, rides, fares |
| Geospatial + Cache | Redis | Driver locations, distributed locks |
| Queue | BullMQ | Async ride request processing |
| Testing | Vitest | Fast, TypeScript-native |
| Monorepo | pnpm + Turborepo | Workspace management |
| Containers | Docker + Compose | Local dev, deployment |
| CI/CD | GitHub Actions | Automated testing, builds |

## Architecture

```
src/
  domain/           # Pure business logic, entities, no dependencies
  ports/            # Interfaces (inbound + outbound)
  adapters/
    inbound/        # HTTP controllers (Hono routes)
    outbound/       # Postgres repos, Redis, external APIs
  app/              # Application services (orchestration)
```

## Core Entities

| Entity | Description |
|--------|-------------|
| Rider | Users requesting rides |
| Driver | Users providing rides, with vehicle info |
| Fare | Estimated price for a route |
| Ride | A ride from request to completion |
| Location | Real-time driver positions |

## Learning Path

| Step | Build | System Design Concept |
|------|-------|----------------------|
| 1 | Project skeleton + health check | Hexagonal architecture, Docker |
| 2 | Fare estimation | Domain modeling, ports/adapters |
| 3 | Ride creation + state | State machines, consistency |
| 4 | Driver locations in Redis | Geospatial indexing, write optimization |
| 5 | Nearby driver queries | Spatial queries, read optimization |
| 6 | Driver matching + locks | Distributed locking, race conditions |
| 7 | Request queue | Async processing, load handling |
| 8 | Accept/decline flow | Timeouts, retry logic |

## Development

```bash
pnpm install          # Install dependencies
pnpm dev              # Start development
pnpm test             # Run tests
pnpm build            # Build all packages
docker-compose up     # Start Postgres + Redis
```
