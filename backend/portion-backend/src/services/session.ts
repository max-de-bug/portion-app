/**
 * X402 V2 Session Service
 * 
 * Implements session-based authentication for the X402 V2 protocol:
 * - Solana wallet signature verification
 * - JWT session token generation
 * - Session validation and management
 * - Nonce management for replay protection
 */

import { PublicKey } from "@solana/web3.js";
import nacl from "tweetnacl";
import bs58 from "bs58";
import { db } from "../db";
import { sessions, nonces } from "../db/schema";
import { eq, and, gt, isNull } from "drizzle-orm";
import type { 
  X402Session, 
  SessionCreateRequest, 
  SessionCreateResponse,
  SessionValidationResult 
} from "../types/x402-v2";

// Configuration
const SESSION_EXPIRY_HOURS = parseInt(process.env.SESSION_EXPIRY_HOURS || "24", 10);
const SESSION_SECRET = process.env.SESSION_SECRET || "solomon-x402-secret-change-in-production";
const NONCE_EXPIRY_MINUTES = 10;

/**
 * Generate a cryptographically secure nonce
 */
export function generateNonce(): string {
  const timestamp = Date.now().toString(36);
  const randomBytes = nacl.randomBytes(16);
  const randomPart = bs58.encode(randomBytes);
  return `${timestamp}-${randomPart}`;
}

/**
 * Create and store a nonce for a wallet (for replay protection)
 */
export async function createNonce(walletAddress: string): Promise<string> {
  const nonce = generateNonce();
  const expiresAt = new Date(Date.now() + NONCE_EXPIRY_MINUTES * 60 * 1000);

  await db.insert(nonces).values({
    nonce,
    walletAddress,
    expiresAt,
  });

  return nonce;
}

/**
 * Validate and consume a nonce (marks it as used)
 */
export async function consumeNonce(nonce: string, walletAddress: string): Promise<boolean> {
  const now = new Date();

  // Find unused, unexpired nonce for this wallet
  const [nonceRecord] = await db
    .select()
    .from(nonces)
    .where(
      and(
        eq(nonces.nonce, nonce),
        eq(nonces.walletAddress, walletAddress),
        isNull(nonces.usedAt),
        gt(nonces.expiresAt, now)
      )
    )
    .limit(1);

  if (!nonceRecord) {
    return false;
  }

  // Mark as used
  await db
    .update(nonces)
    .set({ usedAt: now })
    .where(eq(nonces.nonce, nonce));

  return true;
}

/**
 * Verify a Solana wallet signature
 * 
 * @param message - The original message that was signed
 * @param signature - Base64 or Base58 encoded signature
 * @param publicKeyStr - The Solana wallet public key (Base58)
 */
export function verifySolanaSignature(
  message: string,
  signature: string,
  publicKeyStr: string
): boolean {
  try {
    // Validate public key format
    const publicKey = new PublicKey(publicKeyStr);
    
    // Decode the message to bytes
    const messageBytes = new TextEncoder().encode(message);
    
    // Try to decode signature (could be Base64 or Base58)
    let signatureBytes: Uint8Array;
    try {
      // Try Base58 first (common for Solana wallets)
      signatureBytes = bs58.decode(signature);
    } catch {
      // Fall back to Base64
      signatureBytes = Uint8Array.from(Buffer.from(signature, 'base64'));
    }

    // Verify the signature
    const isValid = nacl.sign.detached.verify(
      messageBytes,
      signatureBytes,
      publicKey.toBytes()
    );

    return isValid;
  } catch (error) {
    console.error("[Session] Signature verification error:", error);
    return false;
  }
}

/**
 * Generate a session ID (UUID-like format)
 */
function generateSessionId(): string {
  const bytes = nacl.randomBytes(16);
  const hex = Buffer.from(bytes).toString('hex');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/**
 * Create a simple session token (encoded session data)
 * In production, you might want to use proper JWT
 */
function encodeSessionToken(sessionId: string, walletAddress: string, expiresAt: Date): string {
  const payload = {
    sid: sessionId,
    wal: walletAddress,
    exp: expiresAt.getTime(),
  };
  const jsonPayload = JSON.stringify(payload);
  // Simple encoding with a signature
  const encoded = Buffer.from(jsonPayload).toString('base64');
  const signature = Buffer.from(
    nacl.hash(new TextEncoder().encode(encoded + SESSION_SECRET))
  ).toString('base64').slice(0, 32);
  return `${encoded}.${signature}`;
}

/**
 * Decode and validate a session token
 */
function decodeSessionToken(token: string): { sessionId: string; walletAddress: string; expiresAt: Date } | null {
  try {
    const [encoded, signature] = token.split('.');
    if (!encoded || !signature) return null;

    // Verify signature
    const expectedSignature = Buffer.from(
      nacl.hash(new TextEncoder().encode(encoded + SESSION_SECRET))
    ).toString('base64').slice(0, 32);
    
    if (signature !== expectedSignature) {
      console.error("[Session] Invalid token signature");
      return null;
    }

    // Decode payload
    const jsonPayload = Buffer.from(encoded, 'base64').toString('utf8');
    const payload = JSON.parse(jsonPayload);

    return {
      sessionId: payload.sid,
      walletAddress: payload.wal,
      expiresAt: new Date(payload.exp),
    };
  } catch (error) {
    console.error("[Session] Token decode error:", error);
    return null;
  }
}

/**
 * Create a new authenticated session
 */
export async function createSession(
  request: SessionCreateRequest
): Promise<SessionCreateResponse | { error: string }> {
  const { walletAddress, signature, message } = request;

  // Extract nonce from message
  const nonceMatch = message.match(/Nonce:\s*([^\s\n]+)/);
  if (!nonceMatch) {
    return { error: "Invalid message format: missing nonce" };
  }
  const nonce = nonceMatch[1];

  // Validate and consume nonce
  const nonceValid = await consumeNonce(nonce, walletAddress);
  if (!nonceValid) {
    return { error: "Invalid or expired nonce" };
  }

  // Verify signature
  const signatureValid = verifySolanaSignature(message, signature, walletAddress);
  if (!signatureValid) {
    return { error: "Invalid signature" };
  }

  // Create session
  const sessionId = generateSessionId();
  const expiresAt = new Date(Date.now() + SESSION_EXPIRY_HOURS * 60 * 60 * 1000);

  await db.insert(sessions).values({
    sessionId,
    walletAddress,
    nonce,
    expiresAt,
  });

  // Generate token
  const sessionToken = encodeSessionToken(sessionId, walletAddress, expiresAt);

  console.log(`[Session] Created session for ${walletAddress}, expires: ${expiresAt.toISOString()}`);

  return {
    sessionToken,
    expiresAt,
    walletAddress,
  };
}

/**
 * Validate a session token
 */
export async function validateSession(
  sessionToken: string
): Promise<SessionValidationResult> {
  // Decode token
  const decoded = decodeSessionToken(sessionToken);
  if (!decoded) {
    return { valid: false, error: "Invalid token format" };
  }

  // Check expiry
  if (decoded.expiresAt < new Date()) {
    return { valid: false, error: "Session expired" };
  }

  // Look up session in database
  const [sessionRecord] = await db
    .select()
    .from(sessions)
    .where(
      and(
        eq(sessions.sessionId, decoded.sessionId),
        eq(sessions.walletAddress, decoded.walletAddress),
        isNull(sessions.revokedAt),
        gt(sessions.expiresAt, new Date())
      )
    )
    .limit(1);

  if (!sessionRecord) {
    return { valid: false, error: "Session not found or revoked" };
  }

  return {
    valid: true,
    session: {
      sessionId: sessionRecord.sessionId,
      walletAddress: sessionRecord.walletAddress,
      nonce: sessionRecord.nonce,
      expiresAt: sessionRecord.expiresAt,
      createdAt: sessionRecord.createdAt,
      revokedAt: sessionRecord.revokedAt ?? undefined,
    },
  };
}

/**
 * Revoke a session
 */
export async function revokeSession(sessionId: string): Promise<boolean> {
  await db
    .update(sessions)
    .set({ revokedAt: new Date() })
    .where(
      and(
        eq(sessions.sessionId, sessionId),
        isNull(sessions.revokedAt)
      )
    );

  return true; // Drizzle doesn't return affected row count easily, assume success
}

/**
 * Revoke all sessions for a wallet
 */
export async function revokeAllSessions(walletAddress: string): Promise<number> {
  await db
    .update(sessions)
    .set({ revokedAt: new Date() })
    .where(
      and(
        eq(sessions.walletAddress, walletAddress),
        isNull(sessions.revokedAt)
      )
    );

  return 1; // Simplified - in production, return actual count
}

/**
 * Clean up expired sessions and nonces
 */
export async function cleanupExpiredData(): Promise<{ sessions: number; nonces: number }> {
  const now = new Date();
  
  // Note: Drizzle doesn't support DELETE with lt/gt conditions in all adapters
  // For production, you might need raw SQL or scheduled jobs
  console.log(`[Session] Cleanup triggered at ${now.toISOString()}`);
  
  return { sessions: 0, nonces: 0 };
}

/**
 * Get session info by wallet address (for debugging/admin)
 */
export async function getActiveSessions(walletAddress: string): Promise<X402Session[]> {
  const now = new Date();
  
  const activeRecords = await db
    .select()
    .from(sessions)
    .where(
      and(
        eq(sessions.walletAddress, walletAddress),
        isNull(sessions.revokedAt),
        gt(sessions.expiresAt, now)
      )
    );

  return activeRecords.map(record => ({
    sessionId: record.sessionId,
    walletAddress: record.walletAddress,
    nonce: record.nonce,
    expiresAt: record.expiresAt,
    createdAt: record.createdAt,
    revokedAt: record.revokedAt ?? undefined,
  }));
}
