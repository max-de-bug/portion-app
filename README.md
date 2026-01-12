# Portion - Yield-Powered Payments

Spend your staking yields on AI services via x402 protocol. Your principal stays protected.

## What is Portion?

Portion is a **yield spending** application. It does NOT stake your assets - you stake elsewhere (on Solomon Labs). Portion lets you **spend the appreciation (yield)** from your sUSDV holdings on AI services.

### How It Works

```
┌─────────────────────────────────────────────────────────────────┐
│  1. STAKE (on Solomon Labs)                                     │
│     USDV → Solomon Labs YASS → sUSDV                           │
│     (You do this outside of Portion)                           │
├─────────────────────────────────────────────────────────────────┤
│  2. APPRECIATE                                                  │
│     sUSDV grows at ~10.3% APY via exchange rate appreciation   │
│     Example: 1000 sUSDV → worth 1052 USDV after 6 months       │
├─────────────────────────────────────────────────────────────────┤
│  3. SPEND YIELD (on Portion)                                    │
│     Connect wallet → Portion calculates your yield              │
│     Yield = (sUSDV × exchangeRate) - principal                 │
│     Spend ONLY the yield on AI services                        │
├─────────────────────────────────────────────────────────────────┤
│  4. PRINCIPAL PROTECTED                                         │
│     Your sUSDV (principal) is NEVER touched                    │
│     Only the appreciation is spent                              │
└─────────────────────────────────────────────────────────────────┘
```

## Step-by-Step User Guide

### Step 1: Get sUSDV

1. Go to [Solomon Labs](https://app.solomonlabs.org/)
2. Connect your Solana wallet
3. Deposit USDV
4. Stake to receive sUSDV
5. Your sUSDV now earns ~10.3% APY

### Step 2: Connect to Portion

1. Open Portion app
2. Click "Connect Wallet"
3. Select your Solana wallet (Phantom, Solflare, etc.)
4. Portion automatically detects your sUSDV balance

### Step 3: View Your Spendable Yield

1. Dashboard shows your sUSDV balance
2. "Spendable Yield" = appreciation from your sUSDV
3. This is what you can spend
4. Principal amount shows your protected sUSDV

### Step 4: Spend Yield on AI Services

1. Click "x402 Agent Hub" in sidebar
2. Browse available AI services:
   - GPT-4 ($0.03/request)
   - GPT-4 Turbo ($0.01/request)
   - Claude 3 ($0.025/request)
   - DALL-E 3 ($0.04/image)
   - Whisper ($0.006/minute)
   - Web Search ($0.005/query)
3. Select a service
4. Enter your prompt
5. Yield is automatically deducted
6. Receive AI response

### Step 5: Track Spending

- View remaining yield in real-time
- Payment history in the chat
- All transactions use x402 protocol

## Technical Architecture

### x402 Protocol

Portion uses the [Coinbase x402](https://github.com/coinbase/x402) standard for payments:

```
Client                    Portion Backend              AI Service
   │                           │                           │
   │─── Request AI Service ───►│                           │
   │                           │                           │
   │◄── 402 Payment Required ──│                           │
   │    (yield allocation)     │                           │
   │                           │                           │
   │─── Execute + Payment ────►│                           │
   │    (X-Payment header)     │─── Forward Request ──────►│
   │                           │                           │
   │                           │◄── AI Response ───────────│
   │◄── Response + Receipt ────│                           │
```

### Yield Calculation

```typescript
// Exchange rate increases over time (10.3% APY)
exchangeRate = compound(1, 0.103, daysSinceStake)

// Spendable yield = appreciation only
spendableYield = (sUSDV_balance × exchangeRate) - original_deposit
```

## Development

### Prerequisites

- Node.js 18+
- Solana wallet (Phantom recommended)
- sUSDV tokens (or use devnet demo mode)

### Setup

```bash
# Install dependencies
cd portion-app
npm install

# Install backend dependencies
cd backend/portion-backend
npm install
cd ../..

# Start development servers (Turbopack enabled by default)
npm run dev:all
```

**Note:** Turbopack is enabled by default for faster builds. If you encounter panics with Cyrillic paths (e.g., "Робочий стіл"), use Webpack instead:

```bash
# Use Webpack instead (works with all paths)
npm run dev:all:webpack
```

**Important:** Turbopack is **explicitly disabled** (`--turbo=false`) due to compatibility issues with non-ASCII paths (e.g., Cyrillic characters in "Робочий стіл"). The app uses Webpack which is stable and works with all paths.

**If you still see Turbopack errors:**

1. Stop the dev server (Ctrl+C)
2. Run `.\clear-cache.ps1` to clear the cache
3. Run `npm run dev` again

### Environment Variables

```env
# Frontend (.env.local)
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001

# Backend (.env)
SOLANA_NETWORK=devnet
SOLANA_RPC_DEVNET=https://api.devnet.solana.com
PORTION_TREASURY_ADDRESS=your_treasury_address
```

### Devnet Testing

The app runs in demo mode on devnet, providing simulated yield for testing.

## API Endpoints

### Backend (x402)

| Endpoint                 | Method | Description                  |
| ------------------------ | ------ | ---------------------------- |
| `/x402/services`         | GET    | List available AI services   |
| `/x402/prepare`          | POST   | Prepare payment for service  |
| `/x402/execute/:service` | POST   | Execute service with payment |
| `/x402/yield/:wallet`    | GET    | Get spendable yield          |
| `/x402/history/:wallet`  | GET    | Payment history              |

### Frontend API Routes(Demo)

| Route                | Description           |
| -------------------- | --------------------- |
| `/api/solomon/apy`   | Current sUSDV APY     |
| `/api/solomon/yield` | Yield data for wallet |

## Security

- **Principal Protection**: Only yield (appreciation) can be spent
- **x402 Standard**: Follows Coinbase's open protocol
- **No Custody**: Portion never holds your assets
- **Transparent**: All calculations visible on-chain

## License

MIT
