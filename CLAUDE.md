# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Sklad** is a warehouse/inventory management system with a POS (point-of-sale) workflow. The UI and error messages are written in Uzbek. The repo has three sub-projects:

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

**Database:** Prisma ORM with the `@prisma/adapter-pg` driver. The singleton client is exported from `src/config/db.js`. Use Prisma transactions (`prisma.$transaction`) for any operation that touches multiple tables atomically (sales, stock, debts).

### Key Domain Logic

**Sale lifecycle** (SaleStatus enum):
```
PENDING (cart) → COMPLETED (POS: POST /api/sales/cart/:id/confirm)
              → CANCELLED / RETURNED
```
`SENT_TO_KASSA` remains in the enum but is unreachable — the «Касса» screen was removed (2026-06-12), POS confirms payment directly. A seller can hold multiple parallel `PENDING` sales (cart tabs in POS). Cart operations go through `POST /api/sales/cart/*`. Confirming a cart decrements product stock atomically.

**Roles:** `ADMIN` and `SELLER` (schema also defines `KASSIR`, unused since the Касса removal). Admin-only routes: analytics, users, categories, stock-in, settings, audit log. In `App.jsx` these use `<AdminRoute>`.

**Debt reminders:** `src/jobs/debtReminder.job.js` runs via `node-cron` daily at 20:00. Sends SMS through Eskiz API for debts due tomorrow and marks overdue debts.

**Barcode:** `src/modules/products/barcode.service.js` generates barcodes with `bwip-js`; `BarcodeScanner.jsx` scans with `@zxing/browser`.

### Frontend

**State management:**
- `authStore` (Zustand) — user + tokens in `localStorage`; `logout()` calls `localStorage.clear()`
- `cartStore` (Zustand) — syncs cart with `GET /api/sales/cart/my`; mutations call cart API endpoints
- `themeStore` (Zustand) — dark/light theme

**API client** (`src/api/axios.js`): attaches `Authorization: Bearer <token>` automatically. On 401, attempts a refresh via `POST /api/auth/refresh`; on failure clears storage and redirects to `/login`.

**Route guards:** `<PrivateRoute>` wraps in `<MainLayout>`; `<AdminRoute>` additionally checks `user.role === 'ADMIN'`.

**UI components** (`src/components/ui/`): shared Button, Input, Modal, Table, Select, Badge — use these rather than raw HTML for consistent dark-themed styling.

**Data fetching:** TanStack Query v5 for server state; Zustand for cart/auth. Recharts for dashboard analytics charts. Export via jsPDF + xlsx (`src/utils/export.js`).
