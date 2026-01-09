# Getting Started with [Fastify-CLI](https://www.npmjs.com/package/fastify-cli)
# Portion x402 Backend

Yield-based micropayment backend using the x402 protocol. Enables AI agents and services to spend staking yield without touching principal.

## Features

- **x402 Protocol Implementation** - HTTP 402 Payment Required for micropayments
- **Solomon Labs Integration** - Fetch sUSDV yield and APY data
- **Solana Transaction Verification** - On-chain payment proof verification
- **Yield Detection** - Track claimable and pending yield for wallets

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build:ts

# Start production server
npm start
```

## API Endpoints

### x402 Payment Routes

- `POST /x402/challenge` - Create payment challenge
- `POST /x402/verify` - Verify payment proof
- `POST /x402/spend` - Spend yield for a service
- `GET /x402/yield/:wallet` - Get spendable yield

### Data Routes

- `GET /api/apy` - Current sUSDV APY (~10.3%)
- `GET /api/yield/:wallet` - Yield information for wallet
- `GET /api/balances/:wallet` - All token balances
- `GET /api/health` - Health check

## Environment Variables

```bash
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
PORTION_TREASURY_ADDRESS=<your_treasury_address>
FRONTEND_URL=http://localhost:3000
```

## Architecture

See [X402_ARCHITECTURE.md](./X402_ARCHITECTURE.md) for detailed architecture documentation.

---

This project was bootstrapped with Fastify-CLI.

## Available Scripts

In the project directory, you can run:

### `npm run dev`

To start the app in dev mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

### `npm start`

For production mode

### `npm run test`

Run the test cases.

## Learn More

To learn Fastify, check out the [Fastify documentation](https://fastify.dev/docs/latest/).
