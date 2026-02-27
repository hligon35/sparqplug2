# SparQ Plug

Lean monorepo scaffold for:

- API: Express (ESM) + Firebase Admin + Stripe (Railway-ready)
- Web: Vite + React + Firebase client
- Mobile: Expo + React Native + Firebase client
- Shared: types/models/utils/constants used across apps

## Quick start

This repo uses **pnpm workspaces**. Use `pnpm install` (not `npm install`).

### Node version

This monorepo requires Node **>=20 <23** (Expo CLI will crash on Node 24+).

- If you use `nvm`/`fnm`, this repo pins Node via `.nvmrc` / `.node-version`.
- On Windows, you can use **nvm-windows** or **fnm** to switch Node versions.

1) Install deps:

```bash
pnpm install
```

1) Copy env:

```bash
copy .env.example .env
```

1) Run API + Web:

```bash
pnpm dev
```

API: `http://localhost:4000/health`

Web: `http://localhost:5173`

1) Run Mobile:

```bash
pnpm dev:mobile
```

If Metro's default port (8081) is already in use, the mobile start scripts will automatically pick 8082+ to avoid interactive prompts.

If Expo Go times out connecting to Metro on your phone, start with a tunnel:

```bash
pnpm -C apps/mobile run start:tunnel
```

### Windows note (Node + nvm-windows)

If Windows PATH order causes `node` to resolve to `C:\Program Files\nodejs` instead of nvm’s symlink, use the repo helper:

```powershell
./run-mobile.ps1
```

Or from `cmd.exe`:

```bat
run-mobile.cmd
```

## Packages

- `packages/shared` – shared constants, validation helpers, JSDoc typedefs
- `packages/api` – backend API + webhooks

## Apps

- `apps/web` – web dashboard + billing flow starter
- `apps/mobile` – mobile starter with auth and basic screens
