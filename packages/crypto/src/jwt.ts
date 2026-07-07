import * as jwt from 'jsonwebtoken';

/**
 * Agent token payload structure
 */
export interface AgentTokenPayload {
  agentId: string;
  capabilities: string[];
  keyId: string;
  iat: number;
  exp: number;
}

/**
 * JWT configuration options
 */
export interface JWTOptions {
  expiresIn?: string | number; // Duration string like '1h' or seconds
  algorithm?: jwt.Algorithm;
}

/**
 * Issue a JWT token for an agent
 * 
 * @param agentId - Agent identifier
 * @param capabilities - List of capabilities the agent has
 * @param keyId - Key ID for tracking key rotation
 * @param privateKey - Private key for signing (PEM format or hex for Ed25519)
 * @param options - JWT options (expiration, algorithm)
 * @returns Signed JWT token
 * 
 * @example
 * ```typescript
 * const token = issueAgentToken(
 *   'agent-123',
 *   ['read-document', 'query-database'],
 *   'key-456',
 *   privateKey,
 *   { expiresIn: '1h' }
 * );
 * ```
 */
export function issueAgentToken(
  agentId: string,
  capabilities: string[],
  keyId: string,
  privateKey: string,
  options: JWTOptions = {}
): string {
  const expiresIn = options.expiresIn || '1h';
  const algorithm = options.algorithm || 'HS256';
  
  const payload: Omit<AgentTokenPayload, 'iat' | 'exp'> = {
    agentId,
    capabilities,
    keyId,
  };
  
  return jwt.sign(payload, privateKey, {
    algorithm,
    expiresIn,
  });
}

/**
 * Verify and decode an agent JWT token
 * 
 * @param token - JWT token to verify
 * @param publicKey - Public key or secret for verification
 * @param options - Verification options
 * @returns Decoded token payload
 * @throws Error if token is invalid or expired
 * 
 * @example
 * ```typescript
 * try {
 *   const payload = verifyAgentToken(token, publicKey);
 *   console.log('Agent ID:', payload.agentId);
 * } catch (error) {
 *   console.error('Invalid token:', error.message);
 * }
 * ```
 */
export function verifyAgentToken(
  token: string,
  publicKey: string,
  options?: jwt.VerifyOptions
): AgentTokenPayload {
  const decoded = jwt.verify(token, publicKey, options) as AgentTokenPayload;
  return decoded;
}

/**
 * Decode JWT token without verification (useful for inspection)
 * WARNING: Do not use for authentication - always verify first!
 * 
 * @param token - JWT token to decode
 * @returns Decoded payload or null if invalid format
 */
export function decodeAgentToken(token: string): AgentTokenPayload | null {
  try {
    return jwt.decode(token) as AgentTokenPayload;
  } catch {
    return null;
  }
}

/**
 * Check if a JWT token is expired (without full verification)
 * 
 * @param token - JWT token to check
 * @returns true if expired, false if still valid
 */
export function isTokenExpired(token: string): boolean {
  const decoded = decodeAgentToken(token);
  if (!decoded || !decoded.exp) {
    return true;
  }
  
  const now = Math.floor(Date.now() / 1000);
  return decoded.exp < now;
}

/**
 * Extract key ID from token without verification
 * 
 * @param token - JWT token
 * @returns Key ID or null if not found
 */
export function extractKeyId(token: string): string | null {
  const decoded = decodeAgentToken(token);
  return decoded?.keyId || null;
}
