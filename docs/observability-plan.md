# Observability Plan

## Big Picture (Steps 3a-3h)

Each step builds on the previous, and nothing from earlier steps gets thrown away:

```
3a  Structured logging (Pino)          ← YOU ARE HERE
3b  OTel SDK + auto-instrumentation    ← traces flow, logs get trace IDs
3c  OTel Collector in Docker Compose   ← telemetry has a destination
3d  Tempo + Grafana                    ← trace visualization
3e  Prometheus + Grafana               ← metrics dashboards
3f  Loki + Grafana                     ← centralized log querying
3g  Custom business spans + metrics    ← ride lifecycle spans, match histograms
3h  Tail-based sampling                ← production-grade trace filtering
```

## Architecture Decision: How Observability Fits Hexagonal

**Logging as an outbound port, tracing via OTel API directly.**

- **Logger port** - Follows the existing dependency injection pattern. Application services receive a `Logger` through their deps, just like they receive `RideRepository`. Tests can inject a fake logger (or a capturing spy). This is the "hexagonal" way and keeps business logic free of infrastructure details.
- **Tracing (step 3b+)** - OTel auto-instrumentation handles HTTP/DB/Redis spans automatically. For custom business spans (step 3g), the `@opentelemetry/api` is itself a vendor-neutral abstraction that no-ops when no SDK is registered. Wrapping it in another port adds no value. Direct use is pragmatic and accepted practice.
- **Metrics (step 3e+)** - Same as tracing: OTel metrics API directly.

Logger = port (injected). Tracing/Metrics = OTel API (direct). The logger port also lets us correlate logs with trace context later (step 3b) without changing application services.

## Step 3a: Structured Logging

### What We're Building

Replace `console.log` with structured JSON logging via Pino. Add request logging middleware to Hono with request correlation IDs. Define a `Logger` outbound port so application services can log through dependency injection.

### 1. Define the Logger outbound port

**File:** `src/ports/outbound/logger.ts`

```typescript
export type Logger = {
  readonly info: (msg: string, context?: Record<string, unknown>) => void
  readonly warn: (msg: string, context?: Record<string, unknown>) => void
  readonly error: (msg: string, context?: Record<string, unknown>) => void
  readonly child: (bindings: Record<string, unknown>) => Logger
}
```

The `child` method creates a scoped logger with bound context (e.g., `logger.child({ rideId })` so all subsequent logs include the ride ID). This maps to Pino's `child()`.

### 2. Create Pino logger adapter

**File:** `src/adapters/outbound/pino-logger.ts`

Creates a Pino instance that satisfies the `Logger` port:
- Dev (`NODE_ENV !== 'production'`): pino-pretty for human-readable output
- Production: JSON output (machine-parseable, ready for Loki in step 3f)
- Base bindings: `{ service: "uberclone-api" }`

### 3. Add request logging middleware

**File:** `src/adapters/inbound/request-logger.ts`

Hono middleware that:
- Generates a request ID (crypto.randomUUID)
- Creates a child logger with `{ requestId, method, path }`
- Logs request start at `info` level
- Logs response with status code and duration at `info` level
- Stores the logger on the Hono context (so route handlers can access it)

### 4. Wire logger into application services

**File:** `src/app/ride-creation.ts` (first, as proof of concept)

Add `logger` to dependencies. Log:
- Ride requested (info, with riderId)
- Ride created successfully (info, with rideId)
- Ride creation failed (warn, with error)

Expand to other services in step 3g.

### 5. Wire into app entry point

**Files:** `src/app.ts`, `src/index.ts`

- Create Pino logger in `index.ts`
- Pass to app setup
- Add request logging middleware to Hono app
- Replace `console.log` with logger

### What We're NOT Doing Yet
- No OTel SDK setup (step 3b)
- No trace ID correlation in logs (step 3b)
- No logging in all services (step 3g)
- No OTel Collector or backends (steps 3c-3f)

## Step 3b: OTel SDK + Auto-Instrumentation (Next)

Wire up the OpenTelemetry Node.js SDK with auto-instrumentation. This automatically creates spans for HTTP requests, database queries, and Redis operations. Pino logs get correlated with trace IDs via `pino-opentelemetry-transport`. Application services don't change - auto-instrumentation handles everything.

## Step 3c: OTel Collector in Docker Compose

Add an OTel Collector container that receives telemetry via OTLP/gRPC. Configure receivers, processors (batch), and exporters. This is the central hub that all services export to. ~50MB RAM.

## Step 3d: Tempo + Grafana (Traces)

Add Grafana Tempo for trace storage and Grafana for visualization. Query traces with TraceQL. See the full lifecycle of a ride request as a waterfall of spans.

## Step 3e: Prometheus + Grafana (Metrics)

Add Prometheus for metrics scraping. Track RED metrics: Rate, Errors, Duration. Custom histograms for driver match latency, fare calculations.

## Step 3f: Loki + Grafana (Logs)

Add Grafana Loki for centralized log aggregation. Query with LogQL. Click from a trace span to see correlated logs. Click from a log line to see the full trace.

## Step 3g: Custom Business Spans + Metrics

Add manual instrumentation to application services:
- Ride lifecycle spans (request → match → pickup → complete)
- Driver matching histograms (search radius, candidates evaluated, match latency)
- Fare calculation counters (surge multiplier distribution)

## Step 3h: Tail-Based Sampling

Configure the OTel Collector to only retain interesting traces (errors, slow requests). Reduces storage costs at scale while keeping all the signal.
