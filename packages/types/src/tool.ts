import { z } from 'zod';
import { RiskLevel, RiskLevelSchema, Status, StatusSchema, Timestamps } from './common';

/**
 * Tool definition
 */
export interface Tool extends Timestamps {
  toolId: string;
  name: string;
  description?: string;
  version: string;
  riskLevel: RiskLevel;
  inputSchema?: Record<string, unknown>; // JSON Schema
  outputSchema?: Record<string, unknown>; // JSON Schema
  rateLimit?: RateLimitConfig;
  timeout?: number; // milliseconds
  status: Status;
}

export const ToolSchema = z.object({
  toolId: z.string(),
  name: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
  version: z.string(),
  riskLevel: RiskLevelSchema,
  inputSchema: z.record(z.unknown()).optional(),
  outputSchema: z.record(z.unknown()).optional(),
  rateLimit: z.object({
    requests: z.number().int().positive(),
    per: z.enum(['second', 'minute', 'hour', 'day']),
    perAgent: z.boolean().optional(),
  }).optional(),
  timeout: z.number().int().positive().optional(),
  status: StatusSchema,
  createdAt: z.date(),
  updatedAt: z.date().optional(),
});

/**
 * Rate limit configuration
 */
export interface RateLimitConfig {
  requests: number;
  per: 'second' | 'minute' | 'hour' | 'day';
  perAgent?: boolean;
}

/**
 * Tool execution request
 */
export interface ToolExecutionRequest {
  toolId: string;
  agentId: string;
  input: unknown;
  requestId?: string;
  metadata?: Record<string, unknown>;
}

export const ToolExecutionRequestSchema = z.object({
  toolId: z.string(),
  agentId: z.string().uuid(),
  input: z.unknown(),
  requestId: z.string().uuid().optional(),
  metadata: z.record(z.unknown()).optional(),
});

/**
 * Tool execution response
 */
export interface ToolExecutionResponse {
  executionId: string;
  toolId: string;
  agentId: string;
  result: unknown;
  durationMs: number;
  decision: {
    allowed: boolean;
    policyId: string;
    reason: string;
  };
  receiptId: string; // Reference to audit receipt
  executedAt: Date;
}

export const ToolExecutionResponseSchema = z.object({
  executionId: z.string().uuid(),
  toolId: z.string(),
  agentId: z.string().uuid(),
  result: z.unknown(),
  durationMs: z.number(),
  decision: z.object({
    allowed: z.boolean(),
    policyId: z.string(),
    reason: z.string(),
  }),
  receiptId: z.string().uuid(),
  executedAt: z.date(),
});

/**
 * Tool execution error
 */
export interface ToolExecutionError {
  code: string;
  message: string;
  toolId: string;
  agentId: string;
  timestamp: Date;
  details?: Record<string, unknown>;
}
