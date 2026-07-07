# Verodex - Core Concepts & Terminology

This document defines the key concepts, terminology, and mental models for understanding the Verodex platform.

---

## Core Concepts

### Agent
An autonomous AI system that performs actions on behalf of users or systems. In Verodex, every agent has a cryptographic identity and operates within defined governance policies.

**Properties**:
- Unique identifier (agentId)
- Cryptographic credentials
- Declared capabilities
- Risk profile
- Audit trail

**Example**: A "finance-processor" agent that queries databases and generates reports.

---

### Tool
A specific action or capability that an agent can invoke. Tools are registered, versioned, and have associated risk levels.

**Properties**:
- Tool identifier (toolId)
- Version
- Risk level (low, medium, high, critical)
- Input/output schema
- Rate limits

**Examples**:
- `query-database` - Execute SQL queries (medium risk)
- `read-document` - Access file storage (low risk)
- `delete-record` - Remove data (high risk)
- `execute-code` - Run arbitrary code (critical risk)

---

### Policy
A rule that defines whether an agent can perform a specific action. Policies are evaluated in real-time before tool execution.

**Structure**:
```json
{
  "effect": "allow" | "deny",
  "actions": ["tool-name-pattern"],
  "resources": ["resource-pattern"],
  "conditions": { /* contextual constraints */ }
}
```

**Policy Decision**: `ALLOW` or `DENY` with reasoning

**Examples**:
- Allow read operations during business hours
- Deny high-risk tools without approval
- Require multi-factor auth for critical actions

---

### Policy Bundle
A versioned collection of policies that work together as a governance framework. Bundles can be composed, tested, and rolled back as units.

**Use Cases**:
- Industry-specific policies (finance, healthcare)
- Role-based policies (analyst, admin, auditor)
- Environment-specific policies (dev, staging, production)

---

### Governance
The real-time evaluation and enforcement of policies. Every agent action must pass governance checks before execution.

**Decision Flow**:
1. Agent requests tool execution
2. Identity validates credentials
3. Governance evaluates policies
4. Decision: ALLOW → execute | DENY → reject
5. Audit records decision

**Performance Requirement**: <5ms per decision

---

### Audit Trail
An immutable, tamper-evident record of every agent action, policy decision, and system event. The audit trail is cryptographically signed and hash-chained.

**Properties**:
- Append-only (no deletions)
- Hash-chained (tamper-evident)
- Signed (verifiable authenticity)
- Timestamped (chronological order)
- Searchable (query by agent, action, time)

**Verification**: Anyone can verify the integrity of the audit chain without trusting Verodex.

---

### Audit Receipt
A signed record of a single agent action. Each receipt contains:
- What happened (action, input, output)
- Who did it (agentId)
- When (timestamp)
- Why it was allowed/denied (policy decision)
- Hash linking to previous receipt (chain integrity)
- Cryptographic signature (authenticity)

**Format**:
```json
{
  "receiptId": "uuid",
  "agentId": "finance-processor",
  "action": "query-database",
  "timestamp": "2026-07-07T14:00:00Z",
  "input": { "query": "SELECT * FROM transactions" },
  "output": { "rows": 42 },
  "decision": "allow",
  "policyVersion": "1.2.3",
  "previousHash": "sha256:abc123...",
  "hash": "sha256:def456...",
  "signature": "ed25519:xyz789..."
}
```

---

### Evidence Bundle
A compliance-ready report that aggregates audit receipts and maps them to regulatory requirements. Evidence bundles are generated on-demand in seconds.

**Supported Standards**:
- EU AI Act (Articles 9, 12, 14)
- SOC 2 Type II
- HIPAA
- GDPR Article 22

**Contents**:
- Filtered audit records for the period
- Policy configurations in effect
- Compliance attestation
- Cryptographic verification data
- Summary statistics

---

### Risk Level
A classification of how dangerous a tool or action is. Risk levels inform policy decisions and audit priorities.

**Levels**:
- **Low**: Read-only operations, no data modification
- **Medium**: Write operations with limited scope
- **High**: Destructive operations, sensitive data access
- **Critical**: System-level changes, irreversible actions

**Usage**: Policies can allow/deny based on risk level thresholds.

---

### Capabilities
The declared set of tools an agent is authorized to use. Capabilities are scoped at agent registration and enforced by the identity system.

**Example**:
```typescript
await client.agents.register({
  name: "report-generator",
  capabilities: [
    "read-document",
    "query-database",
    "generate-pdf"
  ]
});
```

**Enforcement**: Even if a policy allows an action, the agent must have the declared capability.

---

### Identity
The cryptographic credentials that uniquely identify an agent. Identity includes:
- Signing keys (Ed25519)
- JWT tokens with scopes
- Automatic key rotation
- Revocation support

**Trust Model**: Zero trust - every request must present valid credentials.

---

### Tenant
An isolated customer environment with its own policies, audit trail, and configuration. Multi-tenancy ensures data isolation between organizations.

**Isolation**:
- Separate policy namespaces
- Isolated audit chains
- Independent billing
- Per-tenant quotas

---

### Memory
Agent-specific storage for maintaining context across actions. Verodex manages three types of memory:

1. **Episodic Memory**: History of actions taken
2. **Semantic Memory**: Learned knowledge and facts
3. **Working Memory**: Current session context

**Constraints**: TTL (time-to-live) and token budgets per agent

---

### Tool Gateway
The execution layer that routes tool calls to their implementations. The gateway enforces:
- Rate limiting
- Timeout management
- Risk-level policies
- Tool versioning

---

### Compliance Reporter
The service that generates evidence bundles by mapping audit data to regulatory frameworks. It understands the specific requirements of each standard.

**Mapping Example** (EU AI Act Article 12):
- Requirement: "High-risk AI systems shall be designed to log events automatically"
- Evidence: Audit receipts showing all agent actions logged
- Attestation: 100% logging coverage, tamper-evident chain

---

## Mental Models

### The Trust Stack

```
┌─────────────────────────────────┐
│   Compliance (Evidence)         │  ← Regulatory trust
├─────────────────────────────────┤
│   Audit (Receipts)              │  ← Historical trust
├─────────────────────────────────┤
│   Governance (Policies)         │  ← Real-time trust
├─────────────────────────────────┤
│   Identity (Credentials)        │  ← Authentication trust
└─────────────────────────────────┘
```

Each layer builds on the one below it. You can't have trustworthy compliance without trustworthy audit, etc.

---

### The Decision Flow

```
Agent Request
     ↓
Identity Check (Who?)
     ↓
Capability Check (Allowed to ask?)
     ↓
Governance Evaluation (Should we allow?)
     ↓
Risk Assessment (How dangerous?)
     ↓
Policy Decision (ALLOW / DENY)
     ↓
[If ALLOW] → Tool Execution
     ↓
Audit Recording (What happened?)
     ↓
Response to Agent
```

---

### The Proof Model

**Traditional Compliance**:
"Trust us, we're compliant" → Auditor reviews dashboard → Maybe believe it

**Verodex Compliance**:
Evidence bundle → Auditor verifies cryptographic proof → Math doesn't lie

**Key Insight**: Compliance is a byproduct of the architecture, not a feature bolted on later.

---

## Key Principles

### 1. Deny by Default
If there's no explicit policy allowing an action, it's denied. Security starts with "no."

### 2. Policy as Code
Policies are versioned, tested, and deployed like software. No manual configuration drift.

### 3. Immutable History
You can't change the past. Audit records are append-only and tamper-evident.

### 4. Zero Trust Architecture
No service trusts any other service. Every request requires cryptographic proof.

### 5. Performance is a Feature
Sub-5ms governance isn't just fast—it's essential for real-time agent systems.

### 6. Proof over Promises
Don't ask auditors to trust you. Give them the math to verify themselves.

### 7. On-Premises First
Customer data never leaves their infrastructure. Trust starts with control.

---

## Common Patterns

### Pattern: Progressive Risk Elevation

**Problem**: Allow agents to try low-risk actions, require approval for high-risk.

**Solution**:
```json
[
  {
    "effect": "allow",
    "actions": ["*"],
    "conditions": { "risk_level": ["low", "medium"] }
  },
  {
    "effect": "deny",
    "actions": ["*"],
    "conditions": {
      "risk_level": ["high", "critical"],
      "approval_required": true
    }
  }
]
```

---

### Pattern: Time-Based Access Control

**Problem**: Allow certain actions only during business hours.

**Solution**:
```json
{
  "effect": "allow",
  "actions": ["delete-*"],
  "conditions": {
    "time_window": {
      "days": ["mon", "tue", "wed", "thu", "fri"],
      "hours": { "between": ["09:00", "17:00"] }
    }
  }
}
```

---

### Pattern: Rate-Limited Access

**Problem**: Prevent agents from overwhelming systems with requests.

**Solution**:
```json
{
  "effect": "allow",
  "actions": ["query-database"],
  "rate_limit": {
    "requests": 100,
    "per": "minute",
    "per_agent": true
  }
}
```

---

### Pattern: Approval Workflow

**Problem**: High-risk actions require human approval.

**Solution**:
```json
{
  "effect": "allow",
  "actions": ["delete-production-data"],
  "conditions": {
    "requires_approval": {
      "approvers": ["admin@company.com"],
      "timeout": "5m"
    }
  }
}
```

---

## Compliance Mappings

### EU AI Act Requirements

| Article | Requirement | Verodex Implementation |
|---------|------------|----------------------|
| Article 9 | Risk management system | Policy-based governance + risk levels |
| Article 12 | Record-keeping (logging) | Immutable audit trail with signed receipts |
| Article 14 | Human oversight | Approval workflows + real-time monitoring |

### SOC 2 Trust Principles

| Principle | Verodex Implementation |
|-----------|----------------------|
| Security | Cryptographic identity, zero trust architecture |
| Availability | Multi-region deployment, 99.9% SLA |
| Processing Integrity | Tamper-evident audit trail |
| Confidentiality | On-premises deployment, encryption at rest/transit |
| Privacy | Per-tenant isolation, data residency controls |

---

## Anti-Patterns (What NOT to Do)

### ❌ Policy Sprawl
**Problem**: Creating hundreds of micro-policies that conflict
**Solution**: Use policy bundles and hierarchy

### ❌ Allow-All Policies
**Problem**: `{"effect": "allow", "actions": ["*"]}`
**Solution**: Explicit allow lists, deny by default

### ❌ Ignoring Audit Volume
**Problem**: Not planning for long-term audit storage growth
**Solution**: Archive strategy, compression, retention policies

### ❌ Manual Compliance
**Problem**: Generating evidence bundles by hand
**Solution**: Automate via Compliance Reporter API

### ❌ Trust without Verification
**Problem**: Not verifying audit chain integrity
**Solution**: Regular verification runs, external audits

---

## FAQ

### Q: What happens if governance is unavailable?
**A**: Fail closed. All requests are denied until governance is available. Availability is critical.

### Q: Can agents bypass policies?
**A**: No. The Tool Gateway enforces governance decisions. Agents can't directly call tools.

### Q: How long are audit records kept?
**A**: Infinite retention by default (compliance requirement). Configurable archival to cold storage.

### Q: Can policies be updated in real-time?
**A**: Yes, but with caution. Policy changes are versioned and can be rolled back.

### Q: What if an agent's credentials are compromised?
**A**: Instant revocation via Identity service. All future requests are denied.

### Q: How is the audit chain verified?
**A**: Hash-chain verification: each receipt's hash must match the next receipt's previousHash. Breaks indicate tampering.

### Q: Can customers modify audit records?
**A**: No. Append-only ledger enforced by Audit service. Even root access can't modify records.

### Q: What's the difference between capabilities and policies?
**A**: Capabilities = "what can this agent ask for?" Policies = "should we allow this request?"

---

## Glossary

| Term | Definition |
|------|-----------|
| **Agent** | Autonomous AI system with cryptographic identity |
| **Tool** | Specific action an agent can invoke |
| **Policy** | Rule governing whether an action is allowed |
| **Governance** | Real-time policy evaluation and enforcement |
| **Audit Trail** | Immutable record of all agent actions |
| **Receipt** | Signed record of a single action |
| **Evidence Bundle** | Compliance report for regulatory standards |
| **Risk Level** | Classification of action danger (low/medium/high/critical) |
| **Capability** | Declared tool an agent is authorized to use |
| **Identity** | Cryptographic credentials for an agent |
| **Tenant** | Isolated customer environment |
| **Hash Chain** | Linked cryptographic hashes ensuring tamper-evidence |
| **JWT** | JSON Web Token for agent authentication |
| **Policy Bundle** | Versioned collection of related policies |
| **Compliance Mapping** | Translation of audit data to regulatory requirements |

---

*Last Updated: July 2026*
*Owner: Product Team*
