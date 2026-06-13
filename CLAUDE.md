# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Sklad** is a **multi-tenant** warehouse/inventory management SaaS with a POS (point-of-sale) workflow — the same app is sold/rented to multiple independent warehouses, each an isolated `Organization`. The UI and error messages are written in Uzbek. The repo has three sub-projects:

- `sklad-backend/` — Node.js/Express 5 REST API (ESM modules)
- `sklad-web/` — React 19 + Vite web frontend
- `sklad-mobile` — Mobile app (git submodule)

## Commands

### Backend

```bash
cd sklad-backend
npm run dev        # start with --watch (hot reload)
npm run start      # production: prisma generate + node
```

After adding/changing Prisma models:
```bash
cd sklad-backend
npx prisma db push      # NOT `migrate dev`!
npx prisma generate
```
⚠️ **Never run `prisma migrate dev` here** — `DATABASE_URL` points at the **shared production DB** (Railway), the migration history is out of sync with the actual schema (changes were applied via `db push`), so `migrate dev` proposes a full database **reset** (data loss). Use `db push`; it aborts on destructive changes unless `--accept-data-loss` is passed.

Tenant provisioning / one-off scripts:
```bash
npm run seed:superadmin <phone> <password>   # create/update the platform SUPER_ADMIN
npm run backfill:org                          # assign org-less rows to a default org (migration helper)
node src/scripts/verifyTenant.js              # assert cross-org isolation (creates+cleans temp data)
```

### Frontend

```bash
cd sklad-web
npm run dev        # Vite dev server
npm run build      # production build
npm run lint       # ESLint
```

## Environment Variables

**Backend** (`sklad-backend/.env`):
```
DATABASE_URL=
JWT_SECRET=
JWT_REFRESH_SECRET=
JWT_EXPIRES_IN=
JWT_REFRESH_EXPIRES_IN=
FIREBASE_SERVICE_ACCOUNT_BASE64=   # base64-encoded service account JSON
FIREBASE_STORAGE_BUCKET=
ESKIZ_EMAIL=                        # SMS provider
ESKIZ_PASSWORD=
```

**Frontend** (`sklad-web/.env`):
```
VITE_API_URL=http://localhost:5000/api
```

## Architecture

### Backend

**Module structure** — each domain follows a 3-file pattern:
```
src/modules/<domain>/
  <domain>.routes.js      # express Router, applies auth/role middleware
  <domain>.controller.js  # handles req/res, calls service
  <domain>.service.js     # Prisma queries and business logic
```

**Middleware chain:** `authMiddleware` (JWT verify → `req.user`) → `roleMiddleware(...roles)` (RBAC guard).

**Response helpers** (`src/utils/response.js`): always use `success(res, data)` and `error(res, message, statusCode)` — all API responses have `{ success, message, data }` shape.

**Audit logging** (`src/utils/audit.js`): call `audit(userId, action, entity, entityId, oldData, newData, req)` inside controllers for any sensitive mutation. Captures IP + User-Agent from `req`.

**Database:** Prisma ORM with the `@prisma/adapter-pg` driver. `src/config/db.js` exports **two** clients:
- `default` (`prisma`) — **tenant-scoped**. Wrapped by `withTenant()` (`src/config/tenant.js`), a `$extends` query extension that auto-injects `organizationId` into every where/create for tenant models. **All request-path code uses this** and gets isolation for free. Use Prisma transactions (`prisma.$transaction`) for multi-table atomic ops (sales, stock, debts) — scoping applies inside transactions too.
- `rawPrisma` — **un-scoped**. Only for system tasks with no/ cross-org context: `login`/`refresh`, the cron job, the super-admin module, and `src/scripts/*` (migrations/seed).

**Multi-tenancy (data isolation):** Every business table carries `organizationId` (nullable in the DB; the extension enforces it at the app layer). The current org is held in an `AsyncLocalStorage` (`tenantContext` in `src/config/tenant.js`), set by `authMiddleware` via `tenantContext.run({ organizationId }, () => next())` from the JWT. The extension is **fail-closed**: a tenant-model query with no org context throws. Relies on Prisma's `extendedWhereUnique` (GA) so `findUnique`/`update`/`delete` accept the extra `organizationId` filter. **Gotchas:** nested writes are NOT intercepted — `sales.service.create` sets `organizationId` on nested `items` manually via `getOrgId()`; child tables queried at top level (`SaleItem`/`DebtPayment`/`CashMovement`, used by analytics) therefore also carry `organizationId`. `User.phone` is **globally** unique (login takes no org code); category name / product barcode / client phone are unique **per-org** (composite). Provisioning, migration & verification scripts live in `src/scripts/` (`backfillOrg`, `seedSuperAdmin`, `verifyTenant`, `smokeTest`, `cleanupTestData`).

### Key Domain Logic

**Sale lifecycle** (SaleStatus enum):
```
PENDING (cart) → COMPLETED (POS: POST /api/sales/cart/:id/confirm)
              → CANCELLED / RETURNED
```
`SENT_TO_KASSA` remains in the enum but is unreachable — the «Касса» screen was removed (2026-06-12), POS confirms payment directly. A seller can hold multiple parallel `PENDING` sales (cart tabs in POS). Cart operations go through `POST /api/sales/cart/*`. Confirming a cart decrements product stock atomically.

**Roles:** `ADMIN` and `SELLER` (schema also defines `KASSIR`, unused since the Касса removal), plus platform-level `SUPER_ADMIN`. Admin-only routes: analytics, users, categories, stock-in, settings, audit log. In `App.jsx` these use `<AdminRoute>`.

**Super-admin (tenant provisioning):** `SUPER_ADMIN` lives outside any org (`organizationId = null`). Backend `src/modules/superadmin` (`requireSuperAdmin` middleware, mounted at `/api/admin`) lists orgs, creates an org + its first ADMIN, and blocks/unblocks orgs — all via `rawPrisma`. Blocked orgs can't log in (`auth.service` checks `organization.isActive`). Bootstrap a super-admin with `npm run seed:superadmin <phone> <password>`. Frontend: `/admin` page (`SuperAdmin.jsx`, Odoo violet `#714B67`), guarded by `<SuperAdminRoute>`; login redirects super-admins there.

**Debt reminders:** `src/jobs/debtReminder.job.js` runs via `node-cron` daily at 20:00. Sends SMS through Eskiz API for debts due tomorrow and marks overdue debts.

**Barcode:** `src/modules/products/barcode.service.js` generates barcodes with `bwip-js`; `BarcodeScanner.jsx` scans with `@zxing/browser`.

### Frontend

**State management:**
- `authStore` (Zustand) — user + tokens in `localStorage`; `logout()` calls `localStorage.clear()`
- `cartStore` (Zustand) — syncs cart with `GET /api/sales/cart/my`; mutations call cart API endpoints
- `themeStore` (Zustand) — dark/light theme

**API client** (`src/api/axios.js`): attaches `Authorization: Bearer <token>` automatically. On 401, attempts a refresh via `POST /api/auth/refresh`; on failure clears storage and redirects to `/login`.

**Route guards:** `<PrivateRoute>` wraps in `<MainLayout>` (and redirects `SUPER_ADMIN` to `/admin`); `<AdminRoute>` additionally checks `user.role === 'ADMIN'`; `<SuperAdminRoute>` renders a sidebar-less full-screen layout only for `SUPER_ADMIN`.

**UI components** (`src/components/ui/`): shared Button, Input, Modal, Table, Select, Badge — use these rather than raw HTML for consistent dark-themed styling.

**Data fetching:** TanStack Query v5 for server state; Zustand for cart/auth. Recharts for dashboard analytics charts. Export via jsPDF + xlsx (`src/utils/export.js`).
