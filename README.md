# BrightBuy — Frontend

The Next.js app for BrightBuy: the **customer storefront** and the **staff console** in one project,
separated by route groups. It talks only to the Go backend (`brightbuy-backend`); the contract is
`../specs/openapi/openapi.yaml`.

- Next.js 16 (App Router, Server Components, Server Actions), React 19, TypeScript, Tailwind CSS 4
- Vitest + React Testing Library (unit/component), Playwright (end-to-end)

## What's in it

| Area | Routes | Notes |
|---|---|---|
| Storefront | `/`, `/products`, `/products/[id]`, `/cart`, `/checkout`, `/orders`, `/orders/[id]`, `/login`, `/register` | Guest cart in browser storage, merged into the server cart at login; order page shows the status timeline |
| Staff console | `/admin` | Sidebar shows only the tools the signed-in role is meant to use |
| Catalogue (07) | `/admin/catalog`, `/new`, `/[id]`, `/categories` | Product/variant/category management, direct-to-storage image upload |
| Inventory (06) | `/admin/inventory` | Exact stock, audited adjustments |
| Orders (08) | `/admin/orders`, `/admin/orders/[id]` | Queue with status filter, valid-next-status actions, cancel with confirmation, history |
| Reports (09) | `/admin/reports` | Five reports, URL-based filters, CSV export |
| Accounts (02) | `/admin/users`, `/admin/roles` | Create staff, edit role permissions |

## Run it

You need the backend running first (see its README): MySQL, migrations applied, API on `:8080`.

```bash
npm install
cp .env.example .env.local        # BACKEND_URL=http://localhost:8080
npm run dev                       # http://localhost:3000
```

To get a staff login: in the backend run `go run ./cmd/api --create-first-admin`, sign in at `/login`,
then create `WAREHOUSE_STAFF`, `ORDER_MANAGER` and `MANAGER` users under **Users**.

Production build: `npm run build && npm start`. Docker: `docker compose up --build` (joins the
backend's `brightbuy-shared` network).

| Variable | Meaning |
|---|---|
| `BACKEND_URL` | Backend base URL. **Server-only** (no `NEXT_PUBLIC_`): the browser never learns it and never calls the backend directly |

## Scripts and checks (what CI runs)

```bash
npm run lint
npx tsc --noEmit
npm test            # Vitest
npm run build
npm run e2e         # Playwright, against a mock backend; run locally
```

## How it is organised

```
src/app/(storefront)/      customer pages and their components
src/app/(admin)/admin/     staff console pages, one folder per feature
src/app/actions/           Server Actions (writes), one file per feature
src/app/api/               Route Handlers the browser needs (cart, checkout, CSV proxy…)
src/lib/api-client/        THE only code that calls the backend; one typed file per feature
src/lib/admin/tools.ts     registry of console tools (nav, overview cards and page gates read it)
src/lib/reports/           declarative report definitions
src/lib/auth/              session helpers, silent refresh, safe redirects
src/components/            shared UI (icons, badges, timeline)
```

Design rules that keep features loosely coupled:

1. **One API client layer.** Components never `fetch` the backend; each feature adds a typed file under
   `lib/api-client/`. A backend change is a one-file fix.
2. **Add a console feature by adding a folder and one registry line** (`lib/admin/tools.ts`). The nav,
   overview and role gate pick it up; nothing else changes.
3. **Reports are data.** A new report is one entry in `lib/reports/definitions.ts`.
4. **Hiding is not security.** Role checks in the UI are a convenience; the backend enforces
   permissions on every call. A forged request gets a real 403.
5. **Mobile first.** Lists are cards that wrap; wide tables scroll inside their own container; no page
   scrolls sideways at 360 px.

## Team and contributions

| Member | Contribution |
|---|---|
| **Sadil** | Project lead and integrator. Frontend scaffold (route groups, Docker, CI), storefront and catalogue pages, authentication and the admin console (users, roles), guest cart and orders pages, and the 07/08/09 consoles (catalogue management with image upload, order management, reports) plus the console tool registry, mobile fixes and the shared API-client cleanup |
| **Raveen** (`yasankharaveen-web`) | Guest and customer cart experience |
| **Isuru** (`imISURUB`) | Frontend→backend health proxy |

Backend, database and spec contributions per member are listed in the backend README.
