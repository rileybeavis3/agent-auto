import * as ed25519 from '@noble/ed25519';

/**
 * Key pair for Ed25519 signing
 */
export interface KeyPair {
  privateKey: string; // Hex encoded
  publicKey: string; // Hex encoded
  algorithm: 'Ed25519';
}

/**
 * Generate a new Ed25519 key pair
 * 
 * @returns Promise resolving to a new key pair
 * 
 * @example
 * ```typescript
 * const keyPair = await generateKeyPair();
 * console.log(keyPair.publicKey); // hex string
 * ```
 */
export async function generateKeyPair(): Promise<KeyPair> {
  const privateKey = ed25519.utils.randomPrivateKey();
  const publicKey = await ed25519.getPublicKey(privateKey);
  
  return {
    privateKey: Buffer.from(privateKey).toString('hex'),
    publicKey: Buffer.from(publicKey).toString('hex'),
    algorithm: 'Ed25519'
  };
}

/**
 * Derive public key from private key
 * 
 * @param privateKeyHex - Private key in hex format
 * @returns Promise resolving to public key in hex format
 */
export async function derivePublicKey(privateKeyHex: string): Promise<string> {
  const privateKey = Buffer.from(privateKeyHex, 'hex');
  const publicKey = await ed25519.getPublicKey(privateKey);
  return Buffer.from(publicKey).toString('hex');
}

/**
 * Validate that a string is a valid Ed25519 public key
 * 
 * @param publicKeyHex - Public key to validate
 * @returns true if valid, false otherwise
 */
export function isValidPublicKey(publicKeyHex: string): boolean {
  try {
    const key = Buffer.from(publicKeyHex, 'hex');
    return key.length === 32; // Ed25519 public keys are 32 bytes
  } catch {
    return false;
  }
}

/**
 * Validate that a string is a valid Ed25519 private key
 * 
 * @param privateKeyHex - Private key to validate
 * @returns true if valid, false otherwise
 */
export function isValidPrivateKey(privateKeyHex: string): boolean {
  try {
    const key = Buffer.from(privateKeyHex, 'hex');
    return key.length === 32; // Ed25519 private keys are 32 bytes
  } catch {
    return false;
  }
}

/**
 * Generate a random key ID for tracking key rotation
 * 
 * @returns Random key ID (UUID v4 format)
 */
export function generateKeyId(): string {
  const crypto = require('crypto');
  return crypto.randomUUID();
}
