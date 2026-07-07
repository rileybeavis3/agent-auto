import { z } from 'zod';
import { GovernanceDecision, GovernanceDecisionSchema } from './governance';

/**
 * Audit receipt - immutable record of an agent action
 */
export interface AuditReceipt {
  receiptId: string;
  agentId: string;
  action: string;
  timestamp: Date;
  input: unknown;
  output: unknown;
  decision: GovernanceDecision;
  policyId: string;
  policyVersion: string;
  previousHash: string; // Hash of previous receipt in chain
  hash: string; // Hash of this receipt
  signature: string; // Cryptographic signature
  metadata?: Record<string, unknown>;
}

export const AuditReceiptSchema = z.object({
  receiptId: z.string().uuid(),
  agentId: z.string().uuid(),
  action: z.string(),
  timestamp: z.date(),
  input: z.unknown(),
  output: z.unknown(),
  decision: GovernanceDecisionSchema,
  policyId: z.string(),
  policyVersion: z.string(),
  previousHash: z.string().length(64), // SHA-256 hex
  hash: z.string().length(64),
  signature: z.string(),
  metadata: z.record(z.unknown()).optional(),
});

/**
 * Audit record request
 */
export interface AuditRecordRequest {
  agentId: string;
  action: string;
  input: unknown;
  output: unknown;
  decision: GovernanceDecision;
  policyId: string;
  policyVersion: string;
  metadata?: Record<string, unknown>;
}

export const AuditRecordRequestSchema = z.object({
  agentId: z.string().uuid(),
  action: z.string(),
  input: z.unknown(),
  output: z.unknown(),
  decision: GovernanceDecisionSchema,
  policyId: z.string(),
  policyVersion: z.string(),
  metadata: z.record(z.unknown()).optional(),
});

/**
 * Chain verification result
 */
export interface ChainVerificationResult {
  valid: boolean;
  recordCount: number;
  chainHead: string;
  errors?: string[];
  verifiedAt: Date;
}

export const ChainVerificationResultSchema = z.object({
  valid: z.boolean(),
  recordCount: z.number().int().nonnegative(),
  chainHead: z.string().length(64),
  errors: z.array(z.string()).optional(),
  verifiedAt: z.date(),
});

/**
 * Audit query parameters
 */
export interface AuditQueryParams {
  agentId?: string;
  action?: string;
  decision?: GovernanceDecision;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

export const AuditQueryParamsSchema = z.object({
  agentId: z.string().uuid().optional(),
  action: z.string().optional(),
  decision: GovernanceDecisionSchema.optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  limit: z.number().int().positive().max(1000).optional(),
  offset: z.number().int().nonnegative().optional(),
});

/**
 * Evidence bundle for compliance
 */
export interface EvidenceBundle {
  bundleId: string;
  standard: 'EU_AI_ACT' | 'SOC2' | 'HIPAA' | 'GDPR';
  period: {
    from: Date;
    to: Date;
  };
  receipts: AuditReceipt[];
  summary: {
    totalActions: number;
    allowedActions: number;
    deniedActions: number;
    uniqueAgents: number;
  };
  complianceAttestation: string;
  generatedAt: Date;
  signature: string;
}

export const EvidenceBundleSchema = z.object({
  bundleId: z.string().uuid(),
  standard: z.enum(['EU_AI_ACT', 'SOC2', 'HIPAA', 'GDPR']),
  period: z.object({
    from: z.date(),
    to: z.date(),
  }),
  receipts: z.array(AuditReceiptSchema),
  summary: z.object({
    totalActions: z.number().int().nonnegative(),
    allowedActions: z.number().int().nonnegative(),
    deniedActions: z.number().int().nonnegative(),
    uniqueAgents: z.number().int().nonnegative(),
  }),
  complianceAttestation: z.string(),
  generatedAt: z.date(),
  signature: z.string(),
});
