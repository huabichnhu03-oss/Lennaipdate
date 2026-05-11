# Lenna Portfolio — Vercel Standalone

A self-contained Vite + React portfolio site with Vercel Serverless Functions for the API and PostgreSQL for persistence. Ready to deploy to Vercel with no monorepo tooling required.

---

## Local Development

### 1. Clone and install

```bash
git clone <your-repo-url>
cd <repo-name>
npm install
```

### 2. Set up environment variables

```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your values (see the file for descriptions of each variable).

For local dev you need at minimum:
- `DATABASE_URL` — a Postgres connection string (Neon free tier works great)
- `ADMIN_PASSWORD` — any string 8+ chars
- `ADMIN_TOKEN_SECRET` — any random string 8+ chars
- `BLOB_READ_WRITE_TOKEN` — a Vercel Blob token (see below)

### 3. Run the dev server

```bash
npm run dev
```

The frontend runs at http://localhost:5173. For the API functions to work locally you'll need the [Vercel CLI](https://vercel.com/docs/cli):

```bash
npm i -g vercel
vercel dev
```

`vercel dev` runs both the Vite frontend and the serverless functions at http://localhost:3000.

---

## Deploying to Vercel

### 1. Provision a Postgres database

Use any Postgres provider that gives you a `DATABASE_URL`:
- **Neon** (recommended free tier): https://neon.tech
- **Supabase**: https://supabase.com
- **Vercel Postgres**: In your Vercel project dashboard → Storage → Create Database

### 2. Provision Vercel Blob storage

1. Go to your Vercel project dashboard → Storage → Create → Blob Store
2. After creating, go to the store → Tokens → Create Token
3. Copy the `BLOB_READ_WRITE_TOKEN` value

### 3. Connect your repo to Vercel

1. Push this directory to a GitHub repository
2. Go to https://vercel.com → Add New Project → Import your repo
3. Vercel will auto-detect Vite — the defaults are correct (output dir: `dist`)

### 4. Add environment variables in Vercel

In your Vercel project → Settings → Environment Variables, add:

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | Postgres connection string |
| `ADMIN_PASSWORD` | Yes | Min 8 chars — protects the /admin panel |
| `ADMIN_TOKEN_SECRET` | Yes | Min 8 chars — signs admin session tokens |
| `BLOB_READ_WRITE_TOKEN` | Yes | Vercel Blob token for asset storage |
| `RESEND_API_KEY` | No | Enables email notifications from contact form |
| `CONTACT_TO_EMAIL` | No | Override contact-form recipient email |

### 5. Deploy

Click **Deploy** in Vercel or push to your main branch. The database tables are created automatically on first API request.

---

## Migrating existing assets

If you have uploaded assets in the Replit environment, you'll need to re-upload them through the Admin panel after deploying. The database content (text, projects, etc.) is migrated by re-saving each section in the Admin → Content editor.

---

## Architecture

- **Frontend**: Vite + React, Tailwind v4, shadcn/ui, framer-motion, wouter
- **API**: Vercel Serverless Functions (Node.js) under `api/`
- **Database**: PostgreSQL — tables are auto-created on first run
- **Assets**: Vercel Blob — images/videos stored and served from Blob CDN
- **Resume**: Vercel Blob — PDF stored at a fixed key and served via `/api/files/resume.pdf`
- **Admin auth**: HMAC-signed tokens (30-day expiry, no sessions needed)
