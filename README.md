# Verodex - The Control Plane for Enterprise AI Agents

## Overview

**Verodex** is the trust layer that makes enterprise AI agents auditable, governable, and compliance-ready by design.

Enterprises don't need more AI. They need to trust it. Verodex provides the infrastructure that makes AI agents safe for regulated industries.

🌐 **Website**: [https://verodex.netlify.app/](https://verodex.netlify.app/)

---

## What We Do

### Three Core Capabilities

1. **Real-Time Governance** - Policy evaluation in <5ms on every agent action
2. **Immutable Audit Trail** - Hash-chained, cryptographically signed receipts
3. **Compliance Automation** - Evidence bundles for EU AI Act, SOC 2, HIPAA, GDPR

### The Value Proposition

We don't sell software — we sell **proof**. Every agent action is:
- ✅ Policy-evaluated before execution
- ✅ Cryptographically signed
- ✅ Immutably recorded
- ✅ Audit-ready on demand

---

## Architecture

Verodex is a microservices platform with 13 core services:

| Service | Port | Purpose |
|---------|------|---------|
| Scheduler | 4101 | Task orchestration |
| **Identity** | 4102 | Cryptographic credentials |
| **Governance** | 4103 | Policy evaluation (<5ms) |
| **Memory** | 4104 | Agent memory (episodic, semantic, working) |
| **Tool Gateway** | 4105 | Controlled tool execution |
| **Audit** | 4106 | Hash-chained immutable ledger |
| Billing | 4107 | Usage metering |
| Marketplace | 4108 | Tool registry |
| Integrations | 4109 | Enterprise connectors |
| Intelligence | 4110 | Anomaly detection |
| **Compliance Reporter** | 4111 | Auto-generated evidence |
| Tenant Registry | 4112 | Multi-tenant isolation |
| Notifications | 4113 | Webhooks & alerts |

**Bold** = Core services for MVP

---

## Quick Start (Coming Soon)

```typescript
// 1. Register an agent
const agent = await verodex.agents.register({
  name: "finance-processor",
  capabilities: ["read-document", "query-database"]
});

// 2. Execute tools with governance
const result = await verodex.tools.execute({
  toolId: "query-database",
  agentId: agent.agentId,
  input: { query: "SELECT * FROM transactions" }
});

// 3. Generate compliance evidence
const report = await verodex.audit.generateReport({
  standard: "EU_AI_ACT",
  period: { from: "2026-01-01" }
});
```

---

## Documentation

### Strategic Documents
- **[SYNTHESIS.md](./SYNTHESIS.md)** - Complete project overview, vision, and roadmap
- **[STRATEGY.md](./STRATEGY.md)** - Product positioning, go-to-market, and success metrics
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Technical architecture and design decisions
- **[CONCEPTS.md](./CONCEPTS.md)** - Core concepts, terminology, and mental models
- **[IMPROVEMENTS.md](./IMPROVEMENTS.md)** - Prioritized opportunities for enhancement

### Key Concepts
- **Agent**: Autonomous AI system with cryptographic identity
- **Policy**: Rules governing what agents can do
- **Governance**: Real-time policy evaluation (<5ms)
- **Audit Trail**: Immutable, tamper-evident record
- **Evidence Bundle**: Compliance report for regulators

---

## Target Market

### Primary Users
- **Head of AI Governance** - Prove compliance, control risk
- **AI Engineering Lead** - Ship agents without compromising safety
- **Compliance Officers** - Verify AI behavior against regulations

### Industries
- Financial Services
- Healthcare
- Government
- Any regulated enterprise deploying AI agents

---

## Compliance Frameworks

### Supported Standards
- ✅ **EU AI Act** (Articles 9, 12, 14) - Ready for Aug 2026 deadline
- ✅ **SOC 2 Type II** - Security, availability, processing integrity
- ✅ **HIPAA** - Healthcare data protection
- ✅ **GDPR Article 22** - Automated decision-making

### What We Provide
- Automatic record-keeping (EU AI Act Article 12)
- Human oversight mechanisms (Article 14)
- Risk management framework (Article 9)
- Evidence generation in seconds (not weeks)

---

## Performance Targets

| Metric | Target | Status |
|--------|--------|--------|
| Policy evaluation latency | <5ms (p99) | 🟡 In progress |
| Audit reconstruction time | <100ms | 🟡 In progress |
| Tamper detection rate | 100% | 🟡 In progress |
| Evidence generation time | <10s | 🔴 Not started |
| System uptime | 99.9% | 🔴 Not started |

---

## Competitive Advantages

1. **Proof, Not Promises** - Auditors verify the math independently
2. **Speed** - Sub-5ms governance, 78ms audit reconstruction
3. **Compliance-Ready** - EU AI Act deadline (Aug 2026) built-in
4. **Zero Trust** - No need to trust the platform itself
5. **On-Premises** - Data never leaves customer infrastructure

---

## Development Status

### ✅ Completed
- Product vision and positioning
- Website and marketing materials
- Technical architecture design
- Compliance framework mapping

### 🟡 In Progress
- Core services (Identity, Governance, Audit)
- SDK development (TypeScript, Python)
- Performance benchmarking

### 🔴 Not Started
- Multi-tenant isolation
- Tool marketplace
- Intelligence service (anomaly detection)
- Production deployment

---

## Roadmap

### Phase 1: MVP (Q3 2026)
- Core services (Identity, Governance, Audit)
- Basic SDK (TypeScript)
- EU AI Act compliance bundle
- 3 design partner customers

### Phase 2: Enterprise (Q4 2026)
- Multi-tenant support
- SOC 2 certification
- Advanced policy language
- 20 enterprise customers

### Phase 3: Scale (2027+)
- Intelligence layer (anomaly detection)
- Tool marketplace
- Partner ecosystem
- 100+ customers

---

## Tech Stack

### Proposed Technologies
- **Backend**: TypeScript (Node.js) or Go
- **Identity**: JWT with Ed25519 signing
- **Audit**: Merkle tree / hash-chain structure
- **Policy**: Custom DSL or Open Policy Agent (Rego)
- **Storage**: PostgreSQL, TimescaleDB, Kafka
- **Deployment**: Kubernetes on customer infrastructure

---

## Contributing

This is currently a commercial product in development. For questions or partnership inquiries, see the website.

---

## License

Proprietary - © 2026 Verodex

Strategy for open source components under consideration. See [IMPROVEMENTS.md](./IMPROVEMENTS.md#14-open-source-core-components) for details.

---

## Contact

- Website: [https://verodex.netlify.app/](https://verodex.netlify.app/)
- Documentation: See files in this repository
- Status: Early stage / Design partner phase

---

## Key Files

| File | Purpose |
|------|---------|
| `README.md` | This overview (you are here) |
| `SYNTHESIS.md` | Complete vision, architecture, and roadmap |
| `STRATEGY.md` | Market positioning and go-to-market |
| `ARCHITECTURE.md` | Technical design and service specifications |
| `CONCEPTS.md` | Terminology and mental models |
| `IMPROVEMENTS.md` | Prioritized enhancement opportunities |

---

*Last Updated: July 2026*
