import * as ed25519 from '@noble/ed25519';

/**
 * Sign data using Ed25519
 * 
 * @param data - Data to sign (will be UTF-8 encoded)
 * @param privateKeyHex - Private key in hex format
 * @returns Promise resolving to signature in hex format
 * 
 * @example
 * ```typescript
 * const signature = await signData('Hello, World!', privateKey);
 * ```
 */
export async function signData(data: string, privateKeyHex: string): Promise<string> {
  const privateKey = Buffer.from(privateKeyHex, 'hex');
  const message = Buffer.from(data, 'utf8');
  const signature = await ed25519.sign(message, privateKey);
  return Buffer.from(signature).toString('hex');
}

/**
 * Verify Ed25519 signature
 * 
 * @param data - Original data that was signed
 * @param signatureHex - Signature in hex format
 * @param publicKeyHex - Public key in hex format
 * @returns Promise resolving to true if valid, false otherwise
 * 
 * @example
 * ```typescript
 * const isValid = await verifySignature('Hello, World!', signature, publicKey);
 * if (isValid) {
 *   console.log('Signature is valid!');
 * }
 * ```
 */
export async function verifySignature(
  data: string,
  signatureHex: string,
  publicKeyHex: string
): Promise<boolean> {
  try {
    const publicKey = Buffer.from(publicKeyHex, 'hex');
    const message = Buffer.from(data, 'utf8');
    const signature = Buffer.from(signatureHex, 'hex');
    
    return await ed25519.verify(signature, message, publicKey);
  } catch (error) {
    // Invalid signature format or verification failed
    return false;
  }
}

/**
 * Sign JSON data (stringifies first)
 * 
 * @param data - JSON-serializable data to sign
 * @param privateKeyHex - Private key in hex format
 * @returns Promise resolving to signature in hex format
 */
export async function signJSON(data: unknown, privateKeyHex: string): Promise<string> {
  const json = JSON.stringify(data);
  return signData(json, privateKeyHex);
}

/**
 * Verify JSON signature
 * 
 * @param data - Original JSON data
 * @param signatureHex - Signature in hex format
 * @param publicKeyHex - Public key in hex format
 * @returns Promise resolving to true if valid, false otherwise
 */
export async function verifyJSONSignature(
  data: unknown,
  signatureHex: string,
  publicKeyHex: string
): Promise<boolean> {
  const json = JSON.stringify(data);
  return verifySignature(json, signatureHex, publicKeyHex);
}
