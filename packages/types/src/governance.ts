import { z } from 'zod';
import { RiskLevel, RiskLevelSchema } from './common';

/**
 * Governance decision - allow or deny
 */
export type GovernanceDecision = 'allow' | 'deny';

export const GovernanceDecisionSchema = z.enum(['allow', 'deny']);

/**
 * Policy evaluation request
 */
export interface PolicyEvaluationRequest {
  agentId: string;
  action: string;
  resource?: string;
  riskLevel: RiskLevel;
  context?: Record<string, unknown>;
}

export const PolicyEvaluationRequestSchema = z.object({
  agentId: z.string().uuid(),
  action: z.string(),
  resource: z.string().optional(),
  riskLevel: RiskLevelSchema,
  context: z.record(z.unknown()).optional(),
});

/**
 * Policy evaluation result
 */
export interface PolicyEvaluationResult {
  decision: GovernanceDecision;
  reason: string;
  policyId: string;
  policyVersion: string;
  riskLevel: RiskLevel;
  evaluatedAt: Date;
  evaluationTimeMs: number;
  requiresApproval?: boolean;
}

export const PolicyEvaluationResultSchema = z.object({
  decision: GovernanceDecisionSchema,
  reason: z.string(),
  policyId: z.string(),
  policyVersion: z.string(),
  riskLevel: RiskLevelSchema,
  evaluatedAt: z.date(),
  evaluationTimeMs: z.number(),
  requiresApproval: z.boolean().optional(),
});

/**
 * Evaluation context passed between services
 */
export interface EvaluationContext {
  timestamp: Date;
  requestId: string;
  agentId: string;
  action: string;
  resource?: string;
  riskLevel: RiskLevel;
  metadata?: Record<string, unknown>;
}
