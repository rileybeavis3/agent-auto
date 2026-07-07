import { createHash } from 'crypto';

/**
 * Compute SHA-256 hash of data
 * 
 * @param data - Data to hash (will be UTF-8 encoded if string)
 * @returns Hash in hex format (64 characters)
 * 
 * @example
 * ```typescript
 * const hash = hashData('Hello, World!');
 * console.log(hash); // "dffd6021bb2bd5b0af676290809ec3a53191dd81c7f70a4b28688a362182986f"
 * ```
 */
export function hashData(data: string | Buffer): string {
  const input = typeof data === 'string' ? Buffer.from(data, 'utf8') : data;
  return createHash('sha256').update(input).digest('hex');
}

/**
 * Compute SHA-256 hash of JSON data (stringifies first)
 * 
 * @param data - JSON-serializable data to hash
 * @returns Hash in hex format (64 characters)
 */
export function hashJSON(data: unknown): string {
  const json = JSON.stringify(data);
  return hashData(json);
}

/**
 * Compute hash of audit receipt for chain integrity
 * 
 * @param receipt - Partial audit receipt (without hash field)
 * @returns Hash in hex format (64 characters)
 * 
 * @example
 * ```typescript
 * const receipt = {
 *   receiptId: '123',
 *   agentId: 'agent-1',
 *   action: 'query-db',
 *   timestamp: new Date(),
 *   previousHash: 'abc...'
 * };
 * const hash = computeReceiptHash(receipt);
 * ```
 */
export function computeReceiptHash(receipt: {
  receiptId: string;
  agentId: string;
  action: string;
  timestamp: Date;
  input?: unknown;
  output?: unknown;
  decision: string;
  policyId: string;
  policyVersion: string;
  previousHash: string;
}): string {
  // Create deterministic representation of receipt
  const data = {
    receiptId: receipt.receiptId,
    agentId: receipt.agentId,
    action: receipt.action,
    timestamp: receipt.timestamp.toISOString(),
    input: receipt.input,
    output: receipt.output,
    decision: receipt.decision,
    policyId: receipt.policyId,
    policyVersion: receipt.policyVersion,
    previousHash: receipt.previousHash,
  };
  
  return hashJSON(data);
}

/**
 * Verify hash chain integrity
 * 
 * @param receipts - Array of receipts in chronological order
 * @returns true if chain is valid, false otherwise
 */
export function verifyHashChain(receipts: Array<{
  hash: string;
  previousHash: string;
}>): boolean {
  if (receipts.length === 0) return true;
  
  for (let i = 1; i < receipts.length; i++) {
    const current = receipts[i];
    const previous = receipts[i - 1];
    
    // Current receipt's previousHash must match previous receipt's hash
    if (current.previousHash !== previous.hash) {
      return false;
    }
  }
  
  return true;
}

/**
 * Compute Merkle root of multiple hashes
 * Useful for summarizing a batch of audit receipts
 * 
 * @param hashes - Array of hashes (hex strings)
 * @returns Merkle root hash in hex format
 */
export function computeMerkleRoot(hashes: string[]): string {
  if (hashes.length === 0) {
    return '0'.repeat(64); // Null hash
  }
  
  if (hashes.length === 1) {
    return hashes[0];
  }
  
  // Build Merkle tree bottom-up
  let currentLevel = [...hashes];
  
  while (currentLevel.length > 1) {
    const nextLevel: string[] = [];
    
    for (let i = 0; i < currentLevel.length; i += 2) {
      if (i + 1 < currentLevel.length) {
        // Hash pair together
        const combined = currentLevel[i] + currentLevel[i + 1];
        nextLevel.push(hashData(combined));
      } else {
        // Odd one out, promote to next level
        nextLevel.push(currentLevel[i]);
      }
    }
    
    currentLevel = nextLevel;
  }
  
  return currentLevel[0];
}
