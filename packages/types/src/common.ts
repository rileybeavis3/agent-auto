import { z } from 'zod';

/**
 * Risk level classification for actions and tools
 */
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export const RiskLevelSchema = z.enum(['low', 'medium', 'high', 'critical']);

/**
 * Status of an entity (agent, tool, etc.)
 */
export type Status = 'active' | 'suspended' | 'revoked' | 'pending';

export const StatusSchema = z.enum(['active', 'suspended', 'revoked', 'pending']);

/**
 * Base timestamp interface
 */
export interface Timestamps {
  createdAt: Date;
  updatedAt?: Date;
}

/**
 * Standard API response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: Record<string, unknown>;
}

/**
 * API error structure
 */
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

/**
 * Pagination parameters
 */
export interface PaginationParams {
  limit?: number;
  offset?: number;
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}
