# Verodex - Technical Architecture

## System Overview

Verodex is a distributed microservices platform that provides governance, audit, and compliance infrastructure for enterprise AI agents. The system runs on-premises behind the customer's firewall.

## Architecture Principles

1. **Zero Trust** - No component trusts any other by default
2. **Immutability** - Audit records cannot be modified or deleted
3. **Performance First** - Sub-5ms governance decisions
4. **Fault Isolation** - Service failures don't cascade
5. **Observable** - Every action produces telemetry
6. **Scalable** - Horizontally scalable for enterprise load

## Service Architecture

### Service Map

```
┌─────────────────────────────────────────────────────────────┐
│                        API Gateway                           │
│                     (External Entry Point)                   │
└─────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Service Mesh                            │
└─────────────────────────────────────────────────────────────┘
          │         │         │         │         │
    ┌─────┴─────┬───┴────┬────┴────┬────┴────┬────┴─────┐
    ▼           ▼        ▼         ▼         ▼          ▼
┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐
│Identity│ │Govern- │ │  Audit │ │ Memory │ │  Tool  │ │Schedule│
│ :4102  │ │ ance   │ │ :4106  │ │ :4104  │ │Gateway │ │  :4101 │
│        │ │ :4103  │ │        │ │        │ │ :4105  │ │        │
└────────┘ └────────┘ └────────┘ └────────┘ └────────┘ └────────┘
    ▼           ▼        ▼         ▼         ▼          ▼
┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐
│Billing │ │Market- │ │Integra-│ │Intelli-│ │Compli- │ │ Tenant │
│ :4107  │ │ place  │ │ tions  │ │ gence  │ │  ance  │ │Registry│
│        │ │ :4108  │ │ :4109  │ │ :4110  │ │Reporter│ │ :4112  │
└────────┘ └────────┘ └────────┘ └────────┘ │ :4111  │ └────────┘
                                             └────────┘
                                                 ▼
                                          ┌────────────┐
                                          │Notifica-   │
                                          │ tions      │
                                          │ :4113      │
                                          └────────────┘
```

## Core Services

### 1. Identity Service (:4102)

**Purpose**: Cryptographic identity and authentication for agents

**Responsibilities**:
- Issue signed JWTs per agent
- Automatic key rotation (configurable schedule)
- Scope enforcement (capabilities per agent)
- Instant credential revocation
- Public key infrastructure management

**Data Store**: Key-value (rotated keys, agent→identity mapping)

**Performance Target**: <2ms token issuance

**Key APIs**:
```typescript
POST /agents/register
  → { agentId, credentials, capabilities }

POST /auth/token
  → { jwt, expiresAt }

DELETE /agents/{agentId}/revoke
  → { revoked: true }

POST /keys/rotate
  → { newKeyId, rotatedAt }
```

---

### 2. Governance Engine (:4103)

**Purpose**: Real-time policy evaluation on every agent action

**Responsibilities**:
- Evaluate policies in <5ms
- Policy bundle management (CRUD)
- Decision caching with invalidation
- Risk-level enforcement
- Policy versioning and rollback

**Data Store**: In-memory cache + persistent policy store

**Performance Target**: <5ms p99 evaluation latency

**Key APIs**:
```typescript
POST /policy/evaluate
  → { decision: "allow" | "deny", reason, riskLevel }

POST /policy/bundles
  → { bundleId, version }

GET /policy/bundles/{id}
  → { policies[], version, createdAt }
```

**Policy Format** (example):
```json
{
  "version": "1.0",
  "policies": [
    {
      "id": "allow-read-documents",
      "effect": "allow",
      "actions": ["read-document"],
      "resources": ["documents/*"],
      "conditions": {
        "risk_level": ["low", "medium"]
      }
    }
  ]
}
```

---

### 3. Audit Service (:4106)

**Purpose**: Immutable, tamper-evident audit trail

**Responsibilities**:
- Record every agent action with signed receipt
- Hash-chain audit records (Merkle tree)
- Tamper detection on read
- Evidence bundle generation
- Offline verification support

**Data Store**: Append-only log with hash chain

**Performance Target**: <10ms write, <100ms chain verification

**Key APIs**:
```typescript
POST /audit/record
  → { receiptId, hash, signature }

GET /audit/chain/verify
  → { valid: true, recordCount, chainHead }

POST /audit/evidence
  → { bundleUrl, standard, period, signedAt }
```

**Audit Record Structure**:
```json
{
  "receiptId": "uuid",
  "agentId": "agent-123",
  "action": "query-database",
  "timestamp": "2026-07-07T14:00:00Z",
  "input": { "query": "..." },
  "output": { "rows": 42 },
  "decision": "allow",
  "policyVersion": "1.2.3",
  "previousHash": "sha256:...",
  "hash": "sha256:...",
  "signature": "ed25519:..."
}
```

---

### 4. Memory Service (:4104)

**Purpose**: Agent memory management with TTL and token budgets

**Responsibilities**:
- Episodic memory (action history)
- Semantic memory (learned knowledge)
- Working memory (session context)
- TTL-based expiration
- Token budget enforcement per agent

**Data Store**: Time-series DB + vector DB

**Performance Target**: <10ms read, <20ms write

**Key APIs**:
```typescript
POST /memory/{agentId}/episodic
  → { memoryId, storedAt }

GET /memory/{agentId}/semantic/search
  → { results[], relevanceScores[] }

POST /memory/{agentId}/working
  → { sessionId, context }
```

---

### 5. Tool Gateway (:4105)

**Purpose**: Controlled execution of agent tools with risk enforcement

**Responsibilities**:
- Route tool calls to registered tools
- Risk-level enforcement
- Rate limiting per agent/tool
- Tool versioning
- Execution timeout management

**Data Store**: Tool registry + execution queue

**Performance Target**: <50ms tool dispatch (excludes tool execution)

**Key APIs**:
```typescript
POST /tools/execute
  → { executionId, result, duration }

POST /tools/register
  → { toolId, version, riskLevel }

GET /tools/{toolId}/status
  → { available: true, rateLimit }
```

---

### 6. Scheduler Service (:4101)

**Purpose**: Cron and event-driven task orchestration

**Responsibilities**:
- Cron-based scheduling
- Event-triggered execution
- Retry logic with exponential backoff
- Distributed task coordination
- Schedule conflict detection

**Data Store**: Task queue + schedule registry

**Performance Target**: <1s schedule accuracy

**Key APIs**:
```typescript
POST /schedules/create
  → { scheduleId, nextRun }

POST /schedules/{id}/trigger
  → { executionId, triggeredAt }
```

---

### 7. Billing Service (:4107)

**Purpose**: Usage metering and prepaid credit management

**Responsibilities**:
- Meter every agent action
- Prepaid wallet management per tenant
- Usage reporting
- Credit alerts and enforcement
- Invoice generation

**Data Store**: Time-series usage data + wallet balances

**Performance Target**: <5ms usage recording

---

### 8. Marketplace Service (:4108)

**Purpose**: Curated tool and integration registry

**Responsibilities**:
- Tool publishing and versioning
- Publisher verification
- Tool discovery and search
- Installation tracking
- Security scanning

**Data Store**: Tool metadata + verification records

---

### 9. Integrations Service (:4109)

**Purpose**: Pre-built connectors to enterprise systems

**Responsibilities**:
- OAuth proxying through identity
- Connection configuration
- Credential management
- Integration health checks

**Data Store**: Connection configs + credential vault

---

### 10. Intelligence Service (:4110)

**Purpose**: Cross-agent analytics and anomaly detection

**Responsibilities**:
- Pattern analysis across agents
- Risk scoring per action
- Fleet-wide anomaly detection
- Behavioral baselines
- Alert generation

**Data Store**: Analytics warehouse

**Performance Target**: Real-time streaming analysis

---

### 11. Compliance Reporter (:4111)

**Purpose**: Auto-generated compliance evidence bundles

**Responsibilities**:
- Map audit data to regulatory frameworks
- Generate evidence bundles (EU AI Act, SOC 2, HIPAA, GDPR)
- Compliance gap analysis
- Continuous compliance scoring

**Data Store**: Compliance mappings + generated reports

**Supported Frameworks**:
- EU AI Act (Articles 9, 12, 14)
- SOC 2 Type II
- HIPAA
- GDPR Article 22

---

### 12. Tenant Registry (:4112)

**Purpose**: Multi-tenant isolation and configuration

**Responsibilities**:
- Tenant onboarding
- Isolated policy and audit per tenant
- Resource quotas
- Tenant-specific configuration

**Data Store**: Tenant metadata

---

### 13. Notifications Service (:4113)

**Purpose**: Webhooks and alerting for governance events

**Responsibilities**:
- Webhook delivery
- Slack/PagerDuty integration
- Alert rules and routing
- Delivery retry logic

**Data Store**: Notification configs + delivery logs

---

## Data Flow: Tool Execution

```
1. Agent SDK → POST /tools/execute
2. Identity validates JWT → agentId + capabilities
3. Governance evaluates policy → allow/deny decision
4. If allowed → Tool Gateway executes tool
5. Audit records action → signed receipt
6. Billing meters usage → update wallet
7. Intelligence analyzes pattern → risk score
8. Response → Agent SDK
```

**Latency Breakdown** (target):
- Identity check: 2ms
- Governance eval: 5ms
- Tool dispatch: 50ms
- Tool execution: variable (tool-dependent)
- Audit record: 10ms
- **Total overhead**: ~67ms (excluding tool execution)

## Security Architecture

### Defense in Depth

1. **Network Layer**: Firewall rules, VPC isolation
2. **Identity Layer**: Mutual TLS between services
3. **Authorization Layer**: Service-to-service auth tokens
4. **Data Layer**: Encryption at rest and in transit
5. **Audit Layer**: Immutable logs, tamper detection

### Key Management

- **Agent Keys**: Ed25519 signing keys, rotated every 30 days
- **Service Keys**: RSA 4096 for inter-service auth
- **Audit Keys**: Separate signing key for audit chain
- **Encryption Keys**: AES-256-GCM, rotated every 90 days

### Threat Model

**Protected Against**:
- Unauthorized agent actions
- Audit log tampering
- Policy bypass attempts
- Service impersonation
- Data exfiltration

**Attack Surface**:
- API Gateway (external)
- Service-to-service communication (internal)
- Data stores (internal)

## Deployment Architecture

### Kubernetes-Based Deployment

```yaml
# Example service deployment
apiVersion: apps/v1
kind: Deployment
metadata:
  name: governance-service
spec:
  replicas: 3
  template:
    spec:
      containers:
      - name: governance
        image: verodex/governance:latest
        ports:
        - containerPort: 4103
        resources:
          limits:
            cpu: "2"
            memory: "4Gi"
        livenessProbe:
          httpGet:
            path: /health
            port: 4103
```

### High Availability

- **Service Redundancy**: 3+ replicas per service
- **Database Replication**: Multi-region for audit data
- **Load Balancing**: L7 load balancer with health checks
- **Circuit Breakers**: Prevent cascade failures
- **Graceful Degradation**: Read-only mode if audit unavailable

### Scalability

**Horizontal Scaling**:
- All services stateless (except data stores)
- Scale based on CPU/memory/latency metrics
- Auto-scaling groups per service

**Vertical Scaling**:
- Governance: In-memory cache sizing
- Audit: Append-only log throughput
- Memory: Vector DB sizing

**Performance Targets at Scale**:
- 1000 agents
- 80K tool calls/day per agent
- 80M decisions/day system-wide
- <5ms p99 latency maintained

## Data Stores

### Audit Ledger
- **Type**: Append-only log (e.g., Apache Kafka, FoundationDB)
- **Retention**: Infinite (compliance requirement)
- **Backup**: Continuous replication to cold storage

### Policy Store
- **Type**: Document database (e.g., MongoDB, PostgreSQL JSON)
- **Retention**: Version history retained
- **Cache**: Redis for hot policies

### Memory Store
- **Type**: Vector database (e.g., Pinecone, Weaviate) + time-series DB
- **Retention**: Configurable TTL per agent
- **Search**: Semantic search on embeddings

### Billing Store
- **Type**: Time-series database (e.g., InfluxDB, TimescaleDB)
- **Retention**: 7 years (financial compliance)

## Observability

### Metrics
- Service latency (p50, p99, p999)
- Error rates per endpoint
- Policy evaluation decisions (allow/deny ratio)
- Audit write throughput
- Resource utilization

### Logging
- Structured JSON logs
- Centralized logging (e.g., ELK stack)
- Log retention: 90 days

### Tracing
- Distributed tracing (e.g., Jaeger, OpenTelemetry)
- Trace sampling: 1% in production, 100% for errors

### Alerting
- SLO-based alerts (latency, availability, error rate)
- Business metric alerts (policy violations, anomalies)
- On-call integration (PagerDuty)

## Technology Stack (Proposed)

### Backend Services
- **Language**: TypeScript (Node.js) or Go
- **Framework**: Express/Fastify (Node) or Gin (Go)
- **RPC**: gRPC for inter-service communication

### Data Stores
- **Relational**: PostgreSQL (policies, tenants, metadata)
- **Time-Series**: TimescaleDB (billing, metrics)
- **Vector**: Weaviate or Pinecone (semantic memory)
- **Cache**: Redis (policy cache, rate limiting)
- **Queue**: Apache Kafka (audit log, event streaming)

### Infrastructure
- **Container Orchestration**: Kubernetes
- **Service Mesh**: Istio or Linkerd
- **API Gateway**: Kong or Traefik
- **Load Balancer**: NGINX or HAProxy

### Cryptography
- **Signing**: Ed25519 (fast, secure)
- **Hashing**: SHA-256 (audit chain)
- **Encryption**: AES-256-GCM (data at rest)
- **TLS**: TLS 1.3 (data in transit)

### SDK
- **Languages**: TypeScript, Python, Go, Java
- **Features**: Auto-retry, circuit breaker, local caching

## Open Technical Questions

1. **Policy Language**: Custom DSL vs. Rego (Open Policy Agent)?
2. **Audit Storage**: Blockchain vs. centralized Merkle tree?
3. **Real-Time Policy Updates**: WebSocket push vs. polling?
4. **Multi-Region**: Active-active vs. active-passive?
5. **Compliance Storage**: Separate compliance data lake?
6. **Agent SDK Caching**: Local policy caching for offline resilience?

## Next Steps

1. **Validate Architecture** with design partners
2. **Prototype Critical Path** (Identity → Governance → Audit)
3. **Load Testing** at target scale (1000 agents)
4. **Security Review** by external firm
5. **Document API Specifications** (OpenAPI)

---

*Last Updated: July 2026*
*Owner: Engineering Leadership*
