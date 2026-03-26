# Sandro Industrial — Sistema de Facturación

## Overview

Complete professional billing and invoice management system for Sandro Industrial, a construction materials company in Dominican Republic.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite + Tailwind CSS (artifacts/sandro-industrial)
- **API framework**: Express 5 (artifacts/api-server)
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod, drizzle-zod
- **API codegen**: Orval (from OpenAPI spec)
- **Auth**: JWT via bcryptjs + jsonwebtoken
- **Build**: esbuild (CJS bundle)

## Structure

```text
artifacts-monorepo/
├── artifacts/
│   ├── api-server/           # Express API server (all business logic)
│   └── sandro-industrial/    # React+Vite frontend (preview path: /)
├── lib/
│   ├── api-spec/             # OpenAPI spec + Orval codegen config
│   ├── api-client-react/     # Generated React Query hooks
│   ├── api-zod/              # Generated Zod schemas
│   └── db/                   # Drizzle ORM schema + DB connection
│       └── src/schema/
│           ├── users.ts
│           ├── clients.ts
│           ├── products.ts
│           ├── staff.ts
│           └── invoices.ts
├── scripts/
│   └── src/seed.ts           # DB seed script
```

## Default Credentials

- Email: `admin@sandroindustrial.com`
- Password: `admin123`

## Company Info

- **Name**: Sandro Industrial
- **Address**: C/ Duarte, Sector Los Amapolos, Santo Domingo, R.D.
- **Phone**: 809-296-0996 / 809-559-9744
- **RCN**: 131143662

## Brand Colors

- Primary Red: #C0392B (logo, CTA buttons)
- Primary Green: #27AE60 (logo green, success states)
- Accent Yellow: #F1C40F (invoice delivery date highlight)
- Table Header: #2C3E50 (dark slate)

## Features

- **Dashboard**: Metrics (month invoices, revenue, pending/paid counts), bar chart of monthly revenue, recent invoices
- **Invoice Management**: Create, view, edit, print (A4 format matching physical form), soft-delete
- **Invoice Numbering**: Auto-generated SI-YYYY-NNNNNN format, unique via PostgreSQL sequence
- **Print Layout**: Exactly matches physical paper form — yellow delivery date, 8+ product rows
- **Clients**: CRUD, autocomplete in invoice form, invoice history per client
- **Products**: Catalog with categories (Ventanas, Closets, Puertas, etc.), autocomplete in invoice form
- **Staff**: Medidores/Cotizadores management, dropdowns in invoice form
- **Auth**: JWT auth, roles (admin/seller/readonly)

## API Routes

All routes under `/api`:
- `POST /auth/login` — Login with email + password
- `GET /auth/me` — Get current user
- `GET/POST /invoices` — List/create invoices
- `GET/PUT/DELETE /invoices/:id` — Invoice CRUD
- `PATCH /invoices/:id/status` — Update invoice status
- `GET/POST /clients` — List/create clients
- `PUT/DELETE /clients/:id` — Update/delete client
- `GET /clients/:id/invoices` — Client invoice history
- `GET/POST /products` — List/create products
- `PUT/DELETE /products/:id` — Update/delete product
- `GET/POST /staff` — List/create staff
- `PUT/DELETE /staff/:id` — Update/delete staff
- `GET /dashboard/metrics` — Dashboard metrics

## Database Schema

Tables: `users`, `clients`, `products`, `staff`, `invoices`, `invoice_items`

## Running

- Frontend: `pnpm --filter @workspace/sandro-industrial run dev`
- API: `pnpm --filter @workspace/api-server run dev`
- DB push: `pnpm --filter @workspace/db run push`
- Codegen: `pnpm --filter @workspace/api-spec run codegen`
