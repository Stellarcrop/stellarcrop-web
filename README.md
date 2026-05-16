# StellarCrop Web

Web frontend for StellarCrop.

This repo contains:
- Marketing/landing experience (`/`)
- Product application shell (`/app`)
- Pages for receipts, transfers, markets, and settings

## Product Context

StellarCrop enables tokenized warehouse receipts for smallholder farmers on Stellar. The web app is the user-facing layer for:
- Farmer receipt visibility
- Transfer and redemption flows
- Market and pricing views
- Issuer/cooperative operational interfaces

## Tech Stack

- React + TypeScript
- Vite
- CSS (custom design system)

## Local Development

```bash
npm install
cp .env.example .env
npm run dev
```

Default local URL: `http://localhost:5173`

## Environment

See `.env.example` for required values. Typical variables include:
- `VITE_NETWORK`
- `VITE_API_BASE_URL`
- `VITE_RPC_URL`
- `VITE_RECEIPT_CONTRACT_ID`

## Current Status

Implemented:
- Responsive landing page
- App route separation (`/` and `/app`)
- App dashboard navigation
- Core page scaffolds for feature areas

Planned:
- Wallet connect and session handling
- Live data wiring from API/indexer
- Transaction simulation + signing UX
- End-to-end issue/redeem/transfer flows

## Contribution Areas

- Frontend data-fetch hooks and caching strategy
- Wallet integration and auth states
- Form validation and transaction status UX
- Accessibility hardening and test coverage
- Visual regression testing and component docs

## Related Repositories

- `stellarcrop-contracts` (Soroban contracts)
- `stellarcrop-api` (application backend)
- `stellarcrop-indexer` (chain event ingestion)
- `stellarcrop-shared` (shared types/config)
