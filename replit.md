# Lenna Portfolio

A portfolio site for Lenna Hua — a product designer showcasing selected works, studio archive, about, and contact.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/lenna-portfolio run dev` — run the frontend (port 23920)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string
- Optional env: `ADMIN_PASSWORD` (min 8 chars), `ADMIN_TOKEN_SECRET` (min 8 chars), `RESEND_API_KEY`, `CONTACT_TO_EMAIL`
- Optional env (Cloudinary): `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` — when all three are set, admin image uploads go to Cloudinary instead of local disk; required for Vercel production where the local filesystem is ephemeral

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: Vite + React, Tailwind v4, shadcn/ui, framer-motion, wouter, React Query
- API: Express 5 + pg (direct Pool queries, no ORM)
- DB: PostgreSQL (Replit managed)
- Asset storage: local filesystem at `artifacts/api-server/data/assets/`
- Build: esbuild (ESM bundle)

## Where things live

- `artifacts/lenna-portfolio/src/` — frontend source (pages, components, context, lib, data, assets)
- `artifacts/lenna-portfolio/src/pages/` — route pages (entry, home, work, about, studio, contact, admin)
- `artifacts/lenna-portfolio/src/data/` — bundled JSON seed data (projects, gallery, identity, etc.)
- `artifacts/api-server/src/routes/portfolio.ts` — all API routes (content, admin, contact, assets, resume)
- `artifacts/api-server/src/lib/` — db.ts, content-store.ts, assets-store.ts, messages-store.ts, admin-auth.ts, resume-storage.ts
- `artifacts/api-server/src/data/` — seed JSON files (same data the frontend bundles as fallback)
- `artifacts/api-server/data/assets/` — uploaded media files (runtime, gitignored)

## Architecture decisions

- Content sections stored in PostgreSQL (`content` table) with seed data bundled both in frontend (offline fallback) and API server (DB seed); frontend always tries `/api/content/:section` first
- Asset storage uses local filesystem replacing Vercel Blob; files served at `/api/assets/:filename`; production should mount a persistent volume at `ASSETS_DIR`
- Admin auth uses HMAC-signed tokens (no sessions) — `ADMIN_TOKEN_SECRET` must be set in production
- `pg` is externalized from the esbuild bundle (not bundled) to avoid native binding issues
- Seed JSON lives in `artifacts/api-server/src/data/` (bundled into the esbuild output at build time)

## Product

- Entry page with dual-path split (Product Design / Art & Creative)
- Home page with hero, stats, floating decorations
- Work page — project grid with filter by category; project detail pages
- Studio page — art archive with side-scrolling reel
- About page — bio, experience, education
- Contact page — contact form (email via Resend) + admin inbox
- Admin page — password-protected CMS for editing content sections, managing assets, reading messages

## User preferences

_Populate as you build._

## Gotchas

- API server must be built before starting (`dev` script runs build then start)
- `@assets` alias in vite.config.ts points to `src/assets/` (not workspace `attached_assets/`)
- JSON seed files for the API live in `src/data/` (not `data/`) so esbuild can bundle them from `rootDir: "."`
- `pg` must stay in the `external` array in `build.mjs` or the build will fail
- Cloudinary uploads are opt-in: set all three `CLOUDINARY_*` env vars to enable; omitting any one falls back to local disk. On Vercel, local disk is ephemeral so the Cloudinary vars are effectively required in production.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
