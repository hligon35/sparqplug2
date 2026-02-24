# SparQ Plug

Lean monorepo scaffold for:

- API: Express (ESM) + Firebase Admin + Stripe (Railway-ready)
- Web: Vite + React + Firebase client
- Mobile: Expo + React Native + Firebase client
- Shared: types/models/utils/constants used across apps

## Quick start

This repo uses **pnpm workspaces**. Use `pnpm install` (not `npm install`).

1) Install deps:

```bash
pnpm install
```

2) Copy env:

```bash
copy .env.example .env
```

3) Run API + Web:

```bash
pnpm dev
```

API: `http://localhost:4000/health`

Web: `http://localhost:5173`

4) Run Mobile:

```bash
pnpm dev:mobile
```

## Packages

- `packages/shared` – shared constants, validation helpers, JSDoc typedefs
- `packages/api` – backend API + webhooks

## Apps

- `apps/web` – web dashboard + billing flow starter
- `apps/mobile` – mobile starter with auth and basic screens
