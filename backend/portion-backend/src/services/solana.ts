import {
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
  clusterApiUrl,
  ParsedTransactionWithMeta,
} from "@solana/web3.js";

// RPC endpoints
const RPC_ENDPOINTS = [
  process.env.SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com",
  clusterApiUrl("mainnet-beta"),
];

// Token mint addresses
export const TOKEN_MINTS = {
  USDV: process.env.USDV_MINT || "USDVXBhRzuSLKGtq8T9aA3LJNFGpTxvYokGJjm9GkuJ",
  sUSDV:
    process.env.SUSDV_MINT || "sUSDVyWxWGHNT8xqJBzFqFJKNGFXv9fDJ1dqbT1Vy9R",
  SOLO: "SoLoNBhyFwRZzvcJvMVP3c7cjb3Ys5mcPP8DBhKvpump",
};

let connectionInstance: Connection | null = null;

/**
 * Get a working Solana connection with fallback
 */
export async function getConnection(): Promise<Connection> {
  if (connectionInstance) {
    try {
      await connectionInstance.getLatestBlockhash();
      return connectionInstance;
    } catch {
      connectionInstance = null;
    }
  }

  for (const endpoint of RPC_ENDPOINTS) {
    try {
      const connection = new Connection(endpoint, {
        commitment: "confirmed",
        confirmTransactionInitialTimeout: 10000,
      });
      await connection.getLatestBlockhash();
      connectionInstance = connection;
      return connection;
    } catch (error) {
      console.warn(`RPC endpoint ${endpoint} failed:`, error);
      continue;
    }
  }

  throw new Error("Unable to connect to Solana network");
}

/**
 * Get SOL balance for a wallet
 */
export async function getSolBalance(walletAddress: string): Promise<number> {
  const connection = await getConnection();
  const publicKey = new PublicKey(walletAddress);
  const balance = await connection.getBalance(publicKey, "confirmed");
  return balance / LAMPORTS_PER_SOL;
}

/**
 * Get SPL token balance
 */
export async function getTokenBalance(
  walletAddress: string,
  mintAddress: string
): Promise<{ balance: number; decimals: number; uiAmount: string }> {
  const connection = await getConnection();
  const wallet = new PublicKey(walletAddress);
  const mint = new PublicKey(mintAddress);

  try {
    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
      wallet,
      {
        mint,
      }
    );

    if (tokenAccounts.value.length === 0) {
      return { balance: 0, decimals: 6, uiAmount: "0" };
    }

    const tokenAmount =
      tokenAccounts.value[0].account.data.parsed?.info?.tokenAmount;
    return {
      balance: parseInt(tokenAmount?.amount || "0"),
      decimals: tokenAmount?.decimals || 6,
      uiAmount: tokenAmount?.uiAmountString || "0",
    };
  } catch (error) {
    console.error("Failed to fetch token balance:", error);
    return { balance: 0, decimals: 6, uiAmount: "0" };
  }
}

/**
 * Verify a transaction on-chain
 */
export async function verifyTransaction(
  signature: string,
  expectedPayer: string,
  expectedRecipient: string,
  expectedAmount: number,
  tokenMint?: string
): Promise<{
  verified: boolean;
  error?: string;
  transaction?: ParsedTransactionWithMeta;
}> {
  try {
    const connection = await getConnection();

    // Fetch transaction
    const transaction = await connection.getParsedTransaction(signature, {
      commitment: "confirmed",
      maxSupportedTransactionVersion: 0,
    });

    if (!transaction) {
      return { verified: false, error: "Transaction not found" };
    }

    // Check if transaction is confirmed
    if (!transaction.meta || transaction.meta.err) {
      return { verified: false, error: "Transaction failed or not confirmed" };
    }

    // Parse transaction instructions (reserved for future verification)
    // const instructions = transaction.transaction.message.instructions;

    // For SOL transfers
    if (!tokenMint) {
      // Check pre/post balances
      const accountKeys = transaction.transaction.message.accountKeys;
      const preBalances = transaction.meta.preBalances;
      const postBalances = transaction.meta.postBalances;

      const payerIndex = accountKeys.findIndex(
        (key) => key.pubkey.toString() === expectedPayer
      );
      const recipientIndex = accountKeys.findIndex(
        (key) => key.pubkey.toString() === expectedRecipient
      );

      if (payerIndex === -1 || recipientIndex === -1) {
        return {
          verified: false,
          error: "Payer or recipient not found in transaction",
        };
      }

      const amountTransferred =
        (postBalances[recipientIndex] - preBalances[recipientIndex]) /
        LAMPORTS_PER_SOL;

      if (amountTransferred < expectedAmount) {
        return {
          verified: false,
          error: `Insufficient amount: expected ${expectedAmount}, got ${amountTransferred}`,
        };
      }

      return { verified: true, transaction };
    }

    // For SPL token transfers
    const preTokenBalances = transaction.meta.preTokenBalances || [];
    const postTokenBalances = transaction.meta.postTokenBalances || [];

    // Find recipient's token balance change
    const preBalance = preTokenBalances.find(
      (b) => b.mint === tokenMint && b.owner === expectedRecipient
    );
    const postBalance = postTokenBalances.find(
      (b) => b.mint === tokenMint && b.owner === expectedRecipient
    );

    const preAmount = preBalance?.uiTokenAmount?.uiAmount || 0;
    const postAmount = postBalance?.uiTokenAmount?.uiAmount || 0;
    const amountReceived = postAmount - preAmount;

    if (amountReceived < expectedAmount) {
      return {
        verified: false,
        error: `Insufficient token amount: expected ${expectedAmount}, got ${amountReceived}`,
      };
    }

    return { verified: true, transaction };
  } catch (error) {
    console.error("Transaction verification failed:", error);
    return {
      verified: false,
      error: error instanceof Error ? error.message : "Verification failed",
    };
  }
}

/**
 * Create an unsigned transfer transaction
 */
export async function createTransferTransaction(
  fromWallet: string,
  toWallet: string,
  amount: number,
  tokenMint?: string
): Promise<{
  transaction: string; // Base64 encoded
  recentBlockhash: string;
}> {
  const connection = await getConnection();
  const from = new PublicKey(fromWallet);
  const to = new PublicKey(toWallet);

  const { blockhash } = await connection.getLatestBlockhash();
  // lastValidBlockHeight reserved for future timeout handling

  const transaction = new Transaction({
    recentBlockhash: blockhash,
    feePayer: from,
  });

  if (!tokenMint) {
    // SOL transfer
    transaction.add(
      SystemProgram.transfer({
        fromPubkey: from,
        toPubkey: to,
        lamports: Math.floor(amount * LAMPORTS_PER_SOL),
      })
    );
  } else {
    // SPL token transfer - would need @solana/spl-token
    // For now, throw an error
    throw new Error("SPL token transfers not yet implemented in this version");
  }

  const serialized = transaction.serialize({
    requireAllSignatures: false,
    verifySignatures: false,
  });

  return {
    transaction: serialized.toString("base64"),
    recentBlockhash: blockhash,
  };
}
