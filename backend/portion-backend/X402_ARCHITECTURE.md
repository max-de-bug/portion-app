# Portion x402 Payment Architecture

## Overview

Portion enables **yield-based micropayments** using the x402 protocol. Users stake USDV to earn sUSDV yield (currently ~10.3% APY from Solomon Labs), and this yield can be spent on services without touching the principal.

## What is x402?

x402 is a payment protocol based on HTTP status code 402 (Payment Required). It enables:

- **Micropayments** for API access and digital services
- **AI agent self-funding** using yield from staked assets
- **Privacy-preserving payments** via payment proofs
- **Sub-100ms latency** for real-time transactions

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Portion App                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────────┐  │
│  │   Frontend  │───▶│  Next.js    │───▶│   Fastify Backend   │  │
│  │  (React)    │    │  API Routes │    │   (x402 Server)     │  │
│  └─────────────┘    └─────────────┘    └─────────────────────┘  │
│         │                                        │               │
│         │                                        │               │
│         ▼                                        ▼               │
│  ┌─────────────┐                        ┌───────────────────┐   │
│  │   Privy     │                        │  Solana Network   │   │
│  │  (Auth)     │                        │  - sUSDV/USDV     │   │
│  └─────────────┘                        │  - SPL Tokens     │   │
│                                         └───────────────────┘   │
│                                                  │               │
│                                                  ▼               │
│                                         ┌───────────────────┐   │
│                                         │  Solomon Labs     │   │
│                                         │  (Yield Source)   │   │
│                                         └───────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## x402 Payment Flow

### 1. Challenge Creation

```
Client                     Portion x402 Server
   │                              │
   │  POST /x402/challenge        │
   │  { resource, amount }        │
   │─────────────────────────────▶│
   │                              │
   │  HTTP 402 Payment Required   │
   │  { challenge, payTo, amount }│
   │◀─────────────────────────────│
```

### 2. Payment Execution

```
Client                     Solana              Portion x402 Server
   │                          │                        │
   │  Create & Sign TX        │                        │
   │─────────────────────────▶│                        │
   │                          │                        │
   │  TX Signature            │                        │
   │◀─────────────────────────│                        │
   │                                                   │
   │  POST /x402/verify                                │
   │  { signature, payer, amount, challengeId }        │
   │──────────────────────────────────────────────────▶│
   │                                                   │
   │                    Verify on-chain ───────────────│
   │                                                   │
   │  { verified: true, receipt }                      │
   │◀──────────────────────────────────────────────────│
```

### 3. Yield-Based Spending

```
AI Agent                   Portion Backend              Solana
   │                              │                        │
   │  POST /x402/spend            │                        │
   │  { wallet, amount, service } │                        │
   │─────────────────────────────▶│                        │
   │                              │                        │
   │                   Check available yield ──────────────│
   │                              │                        │
   │  { authorization, tx }       │                        │
   │◀─────────────────────────────│                        │
   │                                                       │
   │  Sign & Submit TX ───────────────────────────────────▶│
   │                                                       │
   │  Confirmation ◀───────────────────────────────────────│
```

## API Endpoints

### x402 Routes (`/x402`)

| Endpoint                  | Method | Description              |
| ------------------------- | ------ | ------------------------ |
| `/x402/challenge`         | POST   | Create payment challenge |
| `/x402/verify`            | POST   | Verify payment proof     |
| `/x402/status/:signature` | GET    | Check payment status     |
| `/x402/spend`             | POST   | Spend yield for service  |
| `/x402/yield/:wallet`     | GET    | Get spendable yield      |

### API Routes (`/api`)

| Endpoint                | Method | Description           |
| ----------------------- | ------ | --------------------- |
| `/api/apy`              | GET    | Current sUSDV APY     |
| `/api/yield/:wallet`    | GET    | Yield info for wallet |
| `/api/balances/:wallet` | GET    | Token balances        |
| `/api/health`           | GET    | Health check          |

## Key Concepts

### Spendable Yield

Only the **yield** from staked assets can be spent, never the principal. This is calculated as:

```typescript
spendableYield = claimableYield + pendingYield - allocatedAmount;
```

### Yield Sources

- **sUSDV** - Staked USDV on Solomon Labs (~10.3% APY)
- **LP Rewards** - Liquidity provider fees (future)
- **Staking Rewards** - Validator staking (future)

### Payment Verification

All payments are verified on-chain by:

1. Fetching transaction by signature
2. Verifying transaction is confirmed/finalized
3. Checking recipient matches expected address
4. Validating amount is sufficient
5. Confirming payer signature

## Security Considerations

1. **Never spend principal** - Only verified yield is spendable
2. **Transaction verification** - All payments verified on Solana
3. **Challenge expiry** - Payment challenges expire after 5 minutes
4. **Allocation locking** - Yield is locked when allocated to prevent double-spending
5. **Rate limiting** - Implement rate limits on all endpoints (TODO)

## Environment Variables

```bash
# Solana
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
USDV_MINT=<usdv_mint_address>
SUSDV_MINT=<susdv_mint_address>

# Treasury
PORTION_TREASURY_ADDRESS=<treasury_address>

# Frontend
FRONTEND_URL=http://localhost:3000
```

## Future Enhancements

1. **Multi-chain support** - Expand to Ethereum, Base, etc.
2. **Streaming payments** - Real-time yield streaming
3. **Smart contract integration** - On-chain yield detection
4. **Agent SDK** - JavaScript/Python SDK for AI agents
5. **Subscription support** - Recurring yield-based subscriptions
