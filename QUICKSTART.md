# Verodex - Implementation Quickstart Guide

This guide helps you get started implementing the Verodex platform based on the comprehensive synthesis documents.

---

## 🎯 Before You Start

Read these documents in order:
1. **README.md** - Get the big picture
2. **CONCEPTS.md** - Understand core terminology
3. **SYNTHESIS.md** - Full vision and architecture
4. **IMPROVEMENTS.md** - What to build first

---

## 🚀 Getting Started (Week 1-2)

### Day 1: Environment Setup

**Goal**: Set up development environment

```bash
# Create project structure
mkdir -p verodex/{services,sdk,docs,tests}
cd verodex

# Initialize monorepo (recommended)
npm init -y
npm install -g pnpm  # or yarn workspaces
pnpm init

# Create service directories
mkdir -p services/{identity,governance,audit,gateway}
mkdir -p sdk/{typescript,python}
mkdir -p shared/{types,crypto,utils}

# Initialize git
git init
git remote add origin <your-repo-url>

# Set up TypeScript
npm install -D typescript @types/node
npx tsc --init
```

**Deliverable**: ✅ Project structure ready

---

### Day 2-3: Core Types & Interfaces

**Goal**: Define shared types used across all services

**File**: `shared/types/index.ts`

```typescript
// Agent Identity
export interface Agent {
  agentId: string;
  name: string;
  capabilities: string[];
  credentials: AgentCredentials;
  createdAt: Date;
  status: 'active' | 'suspended' | 'revoked';
}

export interface AgentCredentials {
  publicKey: string;
  keyId: string;
  algorithm: 'Ed25519';
  issuedAt: Date;
  expiresAt: Date;
}

// Policy Types
export interface Policy {
  id: string;
  version: string;
  effect: 'allow' | 'deny';
  actions: string[];
  resources?: string[];
  conditions?: PolicyConditions;
}

export interface PolicyConditions {
  risk_level?: RiskLevel[];
  time_window?: TimeWindow;
  requires_approval?: ApprovalConfig;
}

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

// Governance Decision
export interface GovernanceDecision {
  decision: 'allow' | 'deny';
  reason: string;
  riskLevel: RiskLevel;
  policyId: string;
  evaluatedAt: Date;
  evaluationTimeMs: number;
}

// Audit Receipt
export interface AuditReceipt {
  receiptId: string;
  agentId: string;
  action: string;
  timestamp: Date;
  input: unknown;
  output: unknown;
  decision: 'allow' | 'deny';
  policyVersion: string;
  previousHash: string;
  hash: string;
  signature: string;
}

// Tool Execution
export interface ToolExecutionRequest {
  toolId: string;
  agentId: string;
  input: unknown;
  requestId?: string;
}

export interface ToolExecutionResponse {
  executionId: string;
  result: unknown;
  durationMs: number;
  receipt: AuditReceipt;
}
```

**Deliverable**: ✅ Type definitions for core domain objects

---

### Day 4-5: Cryptography Utilities

**Goal**: Implement signing and hashing functions

**File**: `shared/crypto/signing.ts`

```typescript
import { createSign, createVerify, randomBytes } from 'crypto';
import * as ed25519 from '@noble/ed25519'; // Install: npm i @noble/ed25519

// Key generation
export async function generateKeyPair() {
  const privateKey = ed25519.utils.randomPrivateKey();
  const publicKey = await ed25519.getPublicKey(privateKey);
  
  return {
    privateKey: Buffer.from(privateKey).toString('hex'),
    publicKey: Buffer.from(publicKey).toString('hex'),
    algorithm: 'Ed25519' as const
  };
}

// Signing
export async function signData(data: string, privateKeyHex: string): Promise<string> {
  const privateKey = Buffer.from(privateKeyHex, 'hex');
  const message = Buffer.from(data, 'utf8');
  const signature = await ed25519.sign(message, privateKey);
  return Buffer.from(signature).toString('hex');
}

// Verification
export async function verifySignature(
  data: string,
  signatureHex: string,
  publicKeyHex: string
): Promise<boolean> {
  const publicKey = Buffer.from(publicKeyHex, 'hex');
  const message = Buffer.from(data, 'utf8');
  const signature = Buffer.from(signatureHex, 'hex');
  
  return ed25519.verify(signature, message, publicKey);
}

// Hashing for audit chain
export function hashData(data: string): string {
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(data).digest('hex');
}

// Hash chaining
export function computeReceiptHash(receipt: Partial<AuditReceipt>): string {
  const data = JSON.stringify({
    receiptId: receipt.receiptId,
    agentId: receipt.agentId,
    action: receipt.action,
    timestamp: receipt.timestamp,
    previousHash: receipt.previousHash
  });
  return hashData(data);
}
```

**File**: `shared/crypto/jwt.ts`

```typescript
import * as jwt from 'jsonwebtoken'; // npm i jsonwebtoken @types/jsonwebtoken

export interface AgentTokenPayload {
  agentId: string;
  capabilities: string[];
  iat: number;
  exp: number;
}

export function issueAgentToken(
  agentId: string,
  capabilities: string[],
  privateKey: string,
  expiresIn: string = '1h'
): string {
  const payload: AgentTokenPayload = {
    agentId,
    capabilities,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (60 * 60) // 1 hour
  };
  
  return jwt.sign(payload, privateKey, { algorithm: 'ES256' });
}

export function verifyAgentToken(
  token: string,
  publicKey: string
): AgentTokenPayload {
  return jwt.verify(token, publicKey, { algorithms: ['ES256'] }) as AgentTokenPayload;
}
```

**Deliverable**: ✅ Cryptography utilities working with tests

---

## 📦 Week 2-3: Core Services

### Priority 1: Identity Service

**Location**: `services/identity/`

**Key APIs to Implement**:

```typescript
// services/identity/src/api.ts
import express from 'express';
import { generateKeyPair, issueAgentToken } from '@verodex/crypto';

const router = express.Router();

// POST /agents/register
router.post('/agents/register', async (req, res) => {
  const { name, capabilities } = req.body;
  
  // Generate cryptographic identity
  const keyPair = await generateKeyPair();
  const agentId = generateAgentId();
  
  // Store in database
  await db.agents.create({
    agentId,
    name,
    capabilities,
    publicKey: keyPair.publicKey,
    createdAt: new Date(),
    status: 'active'
  });
  
  // Issue JWT
  const token = issueAgentToken(agentId, capabilities, keyPair.privateKey);
  
  res.json({
    agentId,
    credentials: { token, expiresIn: '1h' },
    capabilities
  });
});

// POST /auth/verify
router.post('/auth/verify', async (req, res) => {
  const { token } = req.body;
  
  try {
    const payload = verifyAgentToken(token, publicKey);
    res.json({ valid: true, agentId: payload.agentId });
  } catch (err) {
    res.status(401).json({ valid: false, error: 'Invalid token' });
  }
});

// DELETE /agents/:agentId/revoke
router.delete('/agents/:agentId/revoke', async (req, res) => {
  const { agentId } = req.params;
  
  await db.agents.update(agentId, { status: 'revoked' });
  
  res.json({ revoked: true });
});
```

**Database Schema** (PostgreSQL):

```sql
CREATE TABLE agents (
  agent_id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  capabilities JSONB NOT NULL,
  public_key TEXT NOT NULL,
  private_key_encrypted TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  revoked_at TIMESTAMP
);

CREATE INDEX idx_agents_status ON agents(status);
```

**Tests**:
```typescript
// services/identity/tests/registration.test.ts
describe('Agent Registration', () => {
  it('should register a new agent with cryptographic identity', async () => {
    const response = await request(app)
      .post('/agents/register')
      .send({
        name: 'test-agent',
        capabilities: ['read-document']
      });
    
    expect(response.status).toBe(200);
    expect(response.body.agentId).toBeDefined();
    expect(response.body.credentials.token).toBeDefined();
  });
  
  it('should verify agent tokens', async () => {
    const agent = await registerAgent();
    
    const response = await request(app)
      .post('/auth/verify')
      .send({ token: agent.credentials.token });
    
    expect(response.body.valid).toBe(true);
  });
  
  it('should revoke agent credentials', async () => {
    const agent = await registerAgent();
    
    await request(app)
      .delete(`/agents/${agent.agentId}/revoke`);
    
    const verifyResponse = await request(app)
      .post('/auth/verify')
      .send({ token: agent.credentials.token });
    
    expect(verifyResponse.body.valid).toBe(false);
  });
});
```

**Deliverable**: ✅ Identity service with agent registration, token issuance, and revocation

---

### Priority 2: Governance Engine

**Location**: `services/governance/`

**Core Implementation**:

```typescript
// services/governance/src/evaluator.ts
import { Policy, GovernanceDecision, RiskLevel } from '@verodex/types';

export class PolicyEvaluator {
  private policyCache: Map<string, Policy[]>;
  
  constructor() {
    this.policyCache = new Map();
  }
  
  async evaluate(
    agentId: string,
    action: string,
    riskLevel: RiskLevel,
    context: Record<string, any> = {}
  ): Promise<GovernanceDecision> {
    const startTime = Date.now();
    
    // Load policies (with caching)
    const policies = await this.loadPolicies(agentId);
    
    // Evaluate each policy
    for (const policy of policies) {
      if (this.matchesPolicy(policy, action, riskLevel, context)) {
        const evaluationTimeMs = Date.now() - startTime;
        
        return {
          decision: policy.effect,
          reason: `Matched policy ${policy.id}`,
          riskLevel,
          policyId: policy.id,
          evaluatedAt: new Date(),
          evaluationTimeMs
        };
      }
    }
    
    // Default deny
    return {
      decision: 'deny',
      reason: 'No matching policy (default deny)',
      riskLevel,
      policyId: 'default',
      evaluatedAt: new Date(),
      evaluationTimeMs: Date.now() - startTime
    };
  }
  
  private matchesPolicy(
    policy: Policy,
    action: string,
    riskLevel: RiskLevel,
    context: Record<string, any>
  ): boolean {
    // Match action pattern
    const actionMatches = policy.actions.some(pattern => 
      this.matchesPattern(pattern, action)
    );
    
    if (!actionMatches) return false;
    
    // Check conditions
    if (policy.conditions?.risk_level) {
      if (!policy.conditions.risk_level.includes(riskLevel)) {
        return false;
      }
    }
    
    // Check time window
    if (policy.conditions?.time_window) {
      if (!this.isWithinTimeWindow(policy.conditions.time_window)) {
        return false;
      }
    }
    
    return true;
  }
  
  private matchesPattern(pattern: string, value: string): boolean {
    // Simple glob matching (* wildcard)
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    return regex.test(value);
  }
  
  private async loadPolicies(agentId: string): Promise<Policy[]> {
    // Check cache first
    if (this.policyCache.has(agentId)) {
      return this.policyCache.get(agentId)!;
    }
    
    // Load from database
    const policies = await db.policies.findByAgent(agentId);
    this.policyCache.set(agentId, policies);
    
    return policies;
  }
}
```

**API**:
```typescript
// services/governance/src/api.ts
router.post('/policy/evaluate', async (req, res) => {
  const { agentId, action, riskLevel, context } = req.body;
  
  const evaluator = new PolicyEvaluator();
  const decision = await evaluator.evaluate(agentId, action, riskLevel, context);
  
  res.json(decision);
});
```

**Deliverable**: ✅ Governance engine with <5ms policy evaluation

---

### Priority 3: Audit Service

**Location**: `services/audit/`

**Core Implementation**:

```typescript
// services/audit/src/ledger.ts
import { AuditReceipt } from '@verodex/types';
import { computeReceiptHash, signData } from '@verodex/crypto';

export class AuditLedger {
  private chainHead: string | null = null;
  
  async recordAction(
    agentId: string,
    action: string,
    input: unknown,
    output: unknown,
    decision: 'allow' | 'deny',
    policyVersion: string
  ): Promise<AuditReceipt> {
    // Create receipt
    const receipt: Partial<AuditReceipt> = {
      receiptId: generateReceiptId(),
      agentId,
      action,
      timestamp: new Date(),
      input,
      output,
      decision,
      policyVersion,
      previousHash: this.chainHead || '0'.repeat(64)
    };
    
    // Compute hash
    receipt.hash = computeReceiptHash(receipt);
    
    // Sign receipt
    receipt.signature = await signData(receipt.hash, privateKey);
    
    // Store in database
    await db.audit.insert(receipt as AuditReceipt);
    
    // Update chain head
    this.chainHead = receipt.hash;
    
    return receipt as AuditReceipt;
  }
  
  async verifyChain(startReceiptId?: string): Promise<boolean> {
    const receipts = await db.audit.getChain(startReceiptId);
    
    for (let i = 1; i < receipts.length; i++) {
      const current = receipts[i];
      const previous = receipts[i - 1];
      
      // Verify hash chain
      if (current.previousHash !== previous.hash) {
        return false;
      }
      
      // Verify signature
      const isValid = await verifySignature(
        current.hash,
        current.signature,
        publicKey
      );
      
      if (!isValid) {
        return false;
      }
    }
    
    return true;
  }
}
```

**Deliverable**: ✅ Audit service with hash-chained receipts and verification

---

## 🧪 Week 4: Integration & Testing

### Integration Test: End-to-End Flow

```typescript
// tests/integration/e2e.test.ts
describe('Verodex End-to-End', () => {
  it('should execute governed tool call with audit', async () => {
    // 1. Register agent
    const agent = await identityService.register({
      name: 'test-agent',
      capabilities: ['query-database']
    });
    
    // 2. Create policy
    await governanceService.createPolicy({
      effect: 'allow',
      actions: ['query-database'],
      conditions: { risk_level: ['low', 'medium'] }
    });
    
    // 3. Execute tool
    const result = await toolGateway.execute({
      toolId: 'query-database',
      agentId: agent.agentId,
      input: { query: 'SELECT 1' }
    });
    
    // 4. Verify decision was allowed
    expect(result.decision.decision).toBe('allow');
    
    // 5. Verify audit receipt created
    expect(result.receipt).toBeDefined();
    expect(result.receipt.agentId).toBe(agent.agentId);
    
    // 6. Verify chain integrity
    const chainValid = await auditService.verifyChain();
    expect(chainValid).toBe(true);
  });
});
```

**Performance Test**:
```typescript
// tests/performance/governance.bench.ts
describe('Governance Performance', () => {
  it('should evaluate policies in <5ms (p99)', async () => {
    const latencies = [];
    
    for (let i = 0; i < 1000; i++) {
      const start = Date.now();
      
      await governanceService.evaluate({
        agentId: 'test-agent',
        action: 'query-database',
        riskLevel: 'medium'
      });
      
      latencies.push(Date.now() - start);
    }
    
    const p99 = percentile(latencies, 99);
    expect(p99).toBeLessThan(5);
  });
});
```

---

## 📚 Next Steps After Quickstart

After completing this quickstart (Weeks 1-4), proceed to:

1. **Tool Gateway** - Implement tool execution routing
2. **SDK Development** - Build TypeScript SDK
3. **Compliance Reporter** - EU AI Act evidence generation
4. **Multi-Tenant Support** - Tenant isolation
5. **Production Deployment** - Kubernetes configs

See **IMPROVEMENTS.md** for the complete prioritized roadmap.

---

## 🛠️ Development Tools

### Recommended Stack

```json
{
  "backend": {
    "runtime": "Node.js 20+",
    "language": "TypeScript 5+",
    "framework": "Express or Fastify",
    "testing": "Jest or Vitest",
    "validation": "Zod or Yup"
  },
  "data": {
    "relational": "PostgreSQL 15+",
    "cache": "Redis 7+",
    "queue": "BullMQ or Kafka"
  },
  "devops": {
    "containerization": "Docker",
    "orchestration": "Kubernetes",
    "ci_cd": "GitHub Actions"
  }
}
```

### Development Commands

```bash
# Install dependencies
pnpm install

# Run tests
pnpm test

# Run services locally
pnpm dev

# Build for production
pnpm build

# Run benchmarks
pnpm benchmark

# Generate docs
pnpm docs
```

---

## 📖 Additional Resources

- **Architecture Diagrams**: See ARCHITECTURE.md
- **API Specifications**: Will be in `/docs/api/` (OpenAPI)
- **Policy Examples**: Will be in `/examples/policies/`
- **Compliance Guides**: Will be in `/docs/compliance/`

---

## 🤝 Getting Help

- Review CONCEPTS.md for terminology
- Check IMPROVEMENTS.md for roadmap context
- Refer to ARCHITECTURE.md for technical decisions

---

*Last Updated: July 2026*
*This is a living document - update as implementation progresses*
