import { z } from 'zod';
import { StatusSchema, Status, Timestamps } from './common';

/**
 * Agent cryptographic credentials
 */
export interface AgentCredentials {
  publicKey: string;
  keyId: string;
  algorithm: 'Ed25519';
  issuedAt: Date;
  expiresAt: Date;
}

export const AgentCredentialsSchema = z.object({
  publicKey: z.string(),
  keyId: z.string(),
  algorithm: z.literal('Ed25519'),
  issuedAt: z.date(),
  expiresAt: z.date(),
});

/**
 * Agent identity and metadata
 */
export interface Agent extends Timestamps {
  agentId: string;
  name: string;
  description?: string;
  capabilities: string[];
  credentials: AgentCredentials;
  status: Status;
  revokedAt?: Date;
  metadata?: Record<string, unknown>;
}

export const AgentSchema = z.object({
  agentId: z.string().uuid(),
  name: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
  capabilities: z.array(z.string()),
  credentials: AgentCredentialsSchema,
  status: StatusSchema,
  revokedAt: z.date().optional(),
  metadata: z.record(z.unknown()).optional(),
  createdAt: z.date(),
  updatedAt: z.date().optional(),
});

/**
 * Agent registration request
 */
export interface AgentRegistrationRequest {
  name: string;
  description?: string;
  capabilities: string[];
  metadata?: Record<string, unknown>;
}

export const AgentRegistrationRequestSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
  capabilities: z.array(z.string()).min(1),
  metadata: z.record(z.unknown()).optional(),
});

/**
 * Agent registration response
 */
export interface AgentRegistrationResponse {
  agentId: string;
  credentials: {
    token: string;
    expiresIn: string;
    keyId: string;
  };
  capabilities: string[];
}

/**
 * Agent token payload (JWT claims)
 */
export interface AgentTokenPayload {
  agentId: string;
  capabilities: string[];
  keyId: string;
  iat: number;
  exp: number;
}

export const AgentTokenPayloadSchema = z.object({
  agentId: z.string().uuid(),
  capabilities: z.array(z.string()),
  keyId: z.string(),
  iat: z.number(),
  exp: z.number(),
});

/**
 * Token verification request
 */
export interface TokenVerificationRequest {
  token: string;
}

export const TokenVerificationRequestSchema = z.object({
  token: z.string(),
});

/**
 * Token verification response
 */
export interface TokenVerificationResponse {
  valid: boolean;
  agentId?: string;
  capabilities?: string[];
  error?: string;
}
