# Crowd Oracle

Crowd Oracle is a small prediction market dApp built for OP_NET. The repository contains:

- `frontend/`: Vite + React client for creating oracles, voting, resolving markets, and claiming rewards.
- `contracts/`: OP_NET smart contract sources and generated ABI files.

## Requirements

- Node.js 22.x
- npm 10+
- OP Wallet / UniSat-compatible wallet extension for browser interaction

## Local development

### Frontend

```bash
cd frontend
cp .env.example .env
npm ci
npm run dev
```

Required frontend environment variables:

- `VITE_CONTRACT_ADDRESS`: deployed Crowd Oracle contract address
- `VITE_OPNET_RPC_URL`: OP_NET RPC URL, defaults to `https://testnet.opnet.org`

### Contracts

```bash
cd contracts
npm ci
npm run build
```

## Deploy to Netlify

This repository is configured for Netlify from the repository root through `netlify.toml`.

Netlify will:

- use `frontend/` as the build base
- run `npm ci && npm run build`
- publish `frontend/dist`
- redirect all routes to `index.html` for React Router

### Netlify environment variables

Set these in the Netlify site settings:

- `VITE_CONTRACT_ADDRESS`
- `VITE_OPNET_RPC_URL` (optional if `https://testnet.opnet.org` is acceptable)

## Git

To publish changes under the requested identity:

```bash
git config user.name "pomid218"
git config user.email "pomid218@gmail.com"
```

Pushing still requires GitHub credentials or a configured token/SSH key with access to the repository.
