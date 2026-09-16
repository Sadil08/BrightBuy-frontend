# brightbuy-frontend

The Next.js frontend for BrightBuy — storefront and admin console in one app, split by route
group. See `../specs/` (in the parent `BrightBuy` folder) for the spec system this follows.

## Local development

```bash
npm install
cp .env.example .env.local
npm run dev
```
- `http://localhost:3000/` — customer storefront
- `http://localhost:3000/admin` — staff/manager console
- `http://localhost:3000/api/health` — this container's own liveness check

**Or via Docker Compose** (talks to `brightbuy-backend`'s stack over the shared network — see that
repo's README first):
```bash
docker compose up --build
```

## Checks (what CI runs — `.github/workflows/ci.yml`)
```bash
npm run lint
npx tsc --noEmit
npm run build
```

## Layout

See `../specs/global/01_TECH_STACK.md` §2/§3.

```
src/app/(storefront)/   customer-facing routes — own root layout (specs/global "route groups")
src/app/(admin)/         staff/manager console routes — own root layout
src/app/api/health/       this container's liveness check
src/lib/api-client/        the ONE place that calls the backend — every feature adds to this,
                            never calls fetch() directly from a component
```

Next.js 16 ships an `AGENTS.md`/`CLAUDE.md` pair reminding AI coding tools to check
`node_modules/next/dist/docs/` before assuming anything about App Router behavior — Turbopack is
now the default bundler and there's a new opt-in Cache Components model (`cacheComponents` in
`next.config.ts`, NOT enabled here yet). Worth reading before big data-fetching changes.
