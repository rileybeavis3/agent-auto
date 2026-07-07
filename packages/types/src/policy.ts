import { z } from 'zod';
import { RiskLevel, RiskLevelSchema, Timestamps } from './common';

/**
 * Policy effect - allow or deny
 */
export type PolicyEffect = 'allow' | 'deny';

export const PolicyEffectSchema = z.enum(['allow', 'deny']);

/**
 * Time window condition for policies
 */
export interface TimeWindow {
  days?: ('mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun')[];
  hours?: {
    between?: [string, string]; // HH:MM format
    not_between?: [string, string];
  };
}

export const TimeWindowSchema = z.object({
  days: z.array(z.enum(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'])).optional(),
  hours: z.object({
    between: z.tuple([z.string(), z.string()]).optional(),
    not_between: z.tuple([z.string(), z.string()]).optional(),
  }).optional(),
});

/**
 * Approval workflow configuration
 */
export interface ApprovalConfig {
  approvers: string[]; // Email addresses
  timeout: string; // Duration string like "5m", "1h"
  required_approvals?: number;
}

export const ApprovalConfigSchema = z.object({
  approvers: z.array(z.string().email()),
  timeout: z.string(),
  required_approvals: z.number().positive().optional(),
});

/**
 * Policy conditions
 */
export interface PolicyConditions {
  risk_level?: RiskLevel[];
  time_window?: TimeWindow;
  requires_approval?: ApprovalConfig;
  [key: string]: unknown;
}

export const PolicyConditionsSchema = z.object({
  risk_level: z.array(RiskLevelSchema).optional(),
  time_window: TimeWindowSchema.optional(),
  requires_approval: ApprovalConfigSchema.optional(),
}).passthrough();

/**
 * Policy definition
 */
export interface Policy extends Timestamps {
  id: string;
  version: string;
  name?: string;
  description?: string;
  effect: PolicyEffect;
  actions: string[]; // Glob patterns like "read-*", "query-database"
  resources?: string[]; // Resource patterns
  conditions?: PolicyConditions;
  priority?: number; // Higher priority = evaluated first
}

export const PolicySchema = z.object({
  id: z.string().uuid(),
  version: z.string(),
  name: z.string().max(255).optional(),
  description: z.string().max(1000).optional(),
  effect: PolicyEffectSchema,
  actions: z.array(z.string()).min(1),
  resources: z.array(z.string()).optional(),
  conditions: PolicyConditionsSchema.optional(),
  priority: z.number().int().optional(),
  createdAt: z.date(),
  updatedAt: z.date().optional(),
});

/**
 * Policy bundle - versioned collection of policies
 */
export interface PolicyBundle extends Timestamps {
  bundleId: string;
  version: string;
  name: string;
  description?: string;
  policies: Policy[];
  agentIds?: string[]; // Agent IDs this bundle applies to
  tenantId?: string;
}

export const PolicyBundleSchema = z.object({
  bundleId: z.string().uuid(),
  version: z.string(),
  name: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
  policies: z.array(PolicySchema),
  agentIds: z.array(z.string().uuid()).optional(),
  tenantId: z.string().uuid().optional(),
  createdAt: z.date(),
  updatedAt: z.date().optional(),
});

/**
 * Policy creation request
 */
export interface PolicyCreateRequest {
  name?: string;
  description?: string;
  effect: PolicyEffect;
  actions: string[];
  resources?: string[];
  conditions?: PolicyConditions;
  priority?: number;
}

export const PolicyCreateRequestSchema = z.object({
  name: z.string().max(255).optional(),
  description: z.string().max(1000).optional(),
  effect: PolicyEffectSchema,
  actions: z.array(z.string()).min(1),
  resources: z.array(z.string()).optional(),
  conditions: PolicyConditionsSchema.optional(),
  priority: z.number().int().optional(),
});
