# Microservices & DevOps Learning Path

> Extending the Uber Clone project to learn advanced microservices and DevOps concepts with AWS deployment.

## Current State Assessment

The project has a solid foundation:
- **Hexagonal architecture** already separates concerns cleanly
- **Docker Compose** for local infrastructure
- **GitHub Actions** for basic CI/CD
- **BullMQ** introduces async processing

Currently a **monolith** - which is the right starting point. We can now decompose it strategically.

---

## Microservices Learning Opportunities

### 1. Service Decomposition

The bounded contexts map naturally to services:

| Service | Responsibility | Database |
|---------|---------------|----------|
| **Rider Service** | Rider accounts, preferences | PostgreSQL |
| **Driver Service** | Driver profiles, vehicles, availability | PostgreSQL |
| **Location Service** | Real-time driver positions | Redis (geospatial) |
| **Fare Service** | Price estimation, surge pricing | PostgreSQL + cache |
| **Ride Service** | Ride lifecycle, state machine | PostgreSQL |
| **Matching Service** | Driver assignment, distributed locks | Redis |

**Concepts learned:** database-per-service pattern, service boundaries, API contracts

### 2. Inter-Service Communication

```
Current: Direct function calls
   ↓
Learning Path:
   ├── Synchronous: REST/gRPC between services
   ├── Asynchronous: Event-driven (Kafka/SQS/EventBridge)
   └── Hybrid: Commands sync, events async
```

**Key patterns to implement:**
- **Saga pattern** for ride booking (spans multiple services)
- **Event sourcing** for ride lifecycle audit trail
- **CQRS** - separate read/write models for location queries (100k requests requirement)

### 3. Resilience Patterns

Required by non-functional requirements:
- **Circuit breakers** - when driver service is down, fail gracefully
- **Retry with backoff** - for the accept/decline timeout flow
- **Bulkhead isolation** - isolate failures between services

---

## DevOps & AWS Learning Opportunities

### Phase 1: Container Orchestration

Move from Docker Compose to Kubernetes (EKS):

```
docker-compose.yml  →  Kubernetes manifests / Helm charts
                           ├── Deployments
                           ├── Services
                           ├── ConfigMaps
                           ├── Secrets
                           ├── Ingress
                           └── HorizontalPodAutoscaler
```

**Concepts learned:**
- Pod lifecycle, liveness/readiness probes
- Service discovery (internal DNS)
- Rolling updates, rollbacks
- Resource limits, autoscaling

### Phase 2: Infrastructure as Code

```
Manual AWS Console  →  Terraform or AWS CDK
                          ├── VPC, subnets, security groups
                          ├── EKS cluster
                          ├── RDS PostgreSQL
                          ├── ElastiCache Redis
                          ├── ECR (container registry)
                          └── IAM roles, policies
```

**Concepts learned:**
- Declarative infrastructure
- State management
- Module composition
- Drift detection

### Phase 3: Observability (Critical for Microservices)

**Why essential:** When a ride request fails across 4 services, you need distributed tracing to debug it. Observability must be in place **before** decomposing into microservices — you can't debug what you can't see.

**Standard:** OpenTelemetry (CNCF-graduated, vendor-neutral). Instrument once, export to any backend.

#### The Three Pillars

| Pillar | What It Answers | Self-Hosted Tool | AWS Native |
|--------|----------------|------------------|------------|
| **Traces** | "What happened during this request?" | Grafana Tempo | X-Ray |
| **Metrics** | "How is the system performing?" | Prometheus + Grafana | CloudWatch Metrics |
| **Logs** | "What specifically happened at this moment?" | Grafana Loki | CloudWatch Logs |

#### Architecture: OTel Collector as Central Hub

```
┌──────────┐  ┌──────────┐  ┌──────────┐
│ Ride Svc │  │Driver Svc│  │Notif Svc │   ← services (OTel SDK)
└────┬─────┘  └────┬─────┘  └────┬─────┘
     │    OTLP/gRPC (4317)       │
     ▼              ▼            ▼
┌──────────────────────────────────────┐
│        OpenTelemetry Collector       │   ← receives, processes, exports
└──┬────────────┬────────────┬─────────┘
   ▼            ▼            ▼
 Tempo      Prometheus     Loki           ← storage backends
(traces)    (metrics)      (logs)
   └────────────┼────────────┘
                ▼
             Grafana                      ← single pane of glass
```

**Key insight:** This architecture is identical whether you run 1 service or 20. The OTel SDK in each service exports via OTLP to the Collector. Context propagation across service boundaries happens automatically via W3C `traceparent` HTTP headers.

#### Implementation Steps

| Step | What | Concepts Learned |
|------|------|-----------------|
| 3a | Structured logging (pino) | JSON logs, log levels, request correlation |
| 3b | OTel SDK + auto-instrumentation | Trace context, spans, auto-instrumented HTTP/DB/Redis |
| 3c | OTel Collector in Docker Compose | Telemetry pipelines: receivers → processors → exporters |
| 3d | Tempo + Grafana | Distributed trace visualization, TraceQL |
| 3e | Prometheus + Grafana | Pull-based metrics, PromQL, RED metrics (Rate/Errors/Duration) |
| 3f | Loki + Grafana | Centralized logs, LogQL, trace-to-log correlation |
| 3g | Custom business spans + metrics | Ride lifecycle spans, driver match histograms, fare counters |
| 3h | Tail-based sampling | Only retain interesting traces (errors, slow requests) at scale |

#### What Survives the Monolith → Microservices Transition

| Concern | Monolith | Microservices | Code Change Required |
|---------|----------|---------------|---------------------|
| Traces | Spans in one process | Spans across processes | None — OTel propagates via headers |
| Logs | One log stream | N log streams | None — Loki correlates by trace ID |
| Metrics | One `/metrics` endpoint | N endpoints | None — Prometheus scrapes all |
| Collector | Optional | Essential (fan-in) | Config change only |

#### Observability Stack Resources (All Self-Hosted)

| Component | RAM | Purpose |
|-----------|-----|---------|
| OTel Collector | ~50MB | Central telemetry pipeline |
| Grafana Tempo | ~100MB | Trace storage + querying |
| Prometheus | ~200MB | Metrics scraping + storage |
| Grafana Loki | ~100MB | Log aggregation |
| Grafana | ~100MB | Unified dashboards |

Total: ~550MB — runs on a laptop alongside Postgres + Redis.

### Phase 4: Advanced CI/CD

```
Current GitHub Actions
   ↓
Enhanced Pipeline:
   ├── Build → Push to ECR
   ├── Security scanning (Trivy, Snyk)
   ├── Deploy to staging (ArgoCD/GitOps)
   ├── Integration tests
   ├── Canary deployment (10% traffic)
   ├── Gradual rollout
   └── Automatic rollback on errors
```

**Key concepts:**
- **GitOps** with ArgoCD - declarative deployments
- **Blue/green** and **canary** releases
- **Feature flags** for controlled rollouts

### Phase 5: AWS Architecture

```
                    ┌─────────────────────────────────────────────────┐
                    │                    AWS                          │
                    │  ┌───────────┐                                  │
        Users ──────┼─▶│ Route 53  │──▶ ALB ──▶ API Gateway          │
                    │  └───────────┘              │                   │
                    │                             ▼                   │
                    │  ┌─────────────────────────────────────────┐   │
                    │  │              EKS Cluster                 │   │
                    │  │  ┌────────┐ ┌────────┐ ┌─────────────┐  │   │
                    │  │  │ Rider  │ │ Driver │ │  Location   │  │   │
                    │  │  │Service │ │Service │ │  Service    │  │   │
                    │  │  └───┬────┘ └───┬────┘ └──────┬──────┘  │   │
                    │  │      │          │             │         │   │
                    │  │  ┌───┴──────────┴─────────────┴──────┐  │   │
                    │  │  │         Service Mesh (App Mesh)   │  │   │
                    │  │  └───────────────────────────────────┘  │   │
                    │  └─────────────────────────────────────────┘   │
                    │         │              │            │           │
                    │         ▼              ▼            ▼           │
                    │  ┌──────────┐   ┌───────────┐  ┌──────────┐    │
                    │  │   RDS    │   │ElastiCache│  │   SQS/   │    │
                    │  │PostgreSQL│   │  (Redis)  │  │EventBridge│   │
                    │  └──────────┘   └───────────┘  └──────────┘    │
                    └─────────────────────────────────────────────────┘
```

---

## Implementation Roadmap

### Mapped to Existing Learning Steps

| Current Step | + Microservices/DevOps Extension |
|--------------|----------------------------------|
| 1. Project skeleton | + Terraform for AWS infra, EKS setup |
| 2. Fare estimation | + Extract as first microservice, deploy to EKS |
| 3. Ride state machine | + Event sourcing, Saga pattern for distributed transactions |
| 4. Driver locations | + Dedicated Location Service, Redis Cluster on ElastiCache |
| 5. Nearby queries | + CQRS pattern, read replicas, caching strategies |
| 6. Matching + locks | + Distributed locking with Redlock, circuit breakers |
| 7. Request queue | + Replace BullMQ with SQS/EventBridge, learn managed queues |
| 8. Accept/decline | + Observability stack, distributed tracing for full flow |
| **9. Observability** | **+ OTel SDK, pino logging, Collector, LGTM stack (Loki/Grafana/Tempo/Mimir)** |

---

## High-Value Complex Concepts

| Concept | Where It Applies | Why It's Hard |
|---------|------------------|---------------|
| **Distributed transactions** | Ride booking spans rider, driver, fare, ride services | No ACID across services |
| **Eventual consistency** | Driver location updates | Stale data acceptable vs strong consistency |
| **Split-brain prevention** | Distributed locks for matching | Redis cluster partitions |
| **Autoscaling** | 100k requests from same location | Scale location service independently |
| **Service mesh** | Inter-service communication | mTLS, retries, circuit breaking at infra level |
| **Chaos engineering** | Kill a service, does system degrade gracefully? | Netflix-style resilience testing |

---

## Recommended Progression

1. **Containerize properly** - Multi-stage Dockerfiles, optimize images
2. **Terraform basics** - Provision a VPC + EKS cluster
3. **Deploy monolith to EKS first** - Learn Kubernetes before decomposing
4. **Add observability** - You'll need it before splitting services
5. **Extract first service** (Fare Service is simplest, fewest dependencies)
6. **Implement service communication** - gRPC or REST + events
7. **Add resilience patterns** - Circuit breakers, retries
8. **Advanced: Saga pattern** for ride booking flow

---

## Resources

### Kubernetes & EKS
- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [EKS Best Practices](https://aws.github.io/aws-eks-best-practices/)
- [Helm Documentation](https://helm.sh/docs/)

### Infrastructure as Code
- [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [AWS CDK Documentation](https://docs.aws.amazon.com/cdk/)

### Microservices Patterns
- [Microservices.io](https://microservices.io/)
- [Sam Newman - Building Microservices](https://samnewman.io/books/building_microservices_2nd_edition/)
- [Chris Richardson - Microservices Patterns](https://microservices.io/book)

### Observability
- [OpenTelemetry Documentation](https://opentelemetry.io/docs/)
- [OpenTelemetry JS SDK](https://opentelemetry.io/docs/languages/js/)
- [Grafana Tempo](https://grafana.com/docs/tempo/latest/)
- [Grafana Loki](https://grafana.com/docs/loki/latest/)
- [Prometheus](https://prometheus.io/docs/)
- [Pino Logger](https://getpino.io/)
- [AWS X-Ray](https://docs.aws.amazon.com/xray/)

### Resilience
- [Release It! by Michael Nygard](https://pragprog.com/titles/mnee2/release-it-second-edition/)
- [Chaos Engineering Principles](https://principlesofchaos.org/)
