# Contributing to StellarCrop

StellarCrop is currently an MVP intended for open-source contribution. The goal is not to ship a production warehouse receipt system yet; the goal is to make the core contract, app, and backend paths clear enough that contributors can pick focused issues.

## Local setup

```bash
npm install
npm run typecheck
npm run test:contracts
npm run dev
```

For contract builds:

```bash
rustup target add wasm32v1-none
npm run build:contracts
```

## Project areas

- `contracts/receipt-registry`: Soroban Rust contract for receipt lifecycle logic.
- `apps/web`: React/Vite frontend with landing page and app dashboard.
- `packages/stellar`: shared Stellar SDK configuration and helpers.
- `docs`: architecture, deployment notes, and contributor roadmap.

## Good first contribution tracks

- Contract tests for missing edge cases.
- Contract event migration to `#[contractevent]`.
- Frontend transaction states and error handling.
- Documentation improvements for deployment and demo flows.
- Backend/indexer design and starter service.

## Contribution expectations

- Keep pull requests focused on one issue.
- Include tests for contract or shared behavior changes.
- Run `npm run typecheck` and `npm run test:contracts` before opening a PR.
- Avoid committing local build outputs such as `apps/web/dist` unless a maintainer explicitly asks.
