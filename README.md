# Lenna Portfolio — Vercel Bundle

Self-contained, Vercel-ready export of the Lenna Hua portfolio.

**👉 To deploy this for the first time, open [`DEPLOY_GUIDE.md`](./DEPLOY_GUIDE.md).**

If anything goes wrong, see [`TROUBLESHOOTING.md`](./TROUBLESHOOTING.md).

---

## What's in here

```
.
├── api/                 ← Vercel serverless functions (the API)
│   ├── index.ts         ← Single entry — every /api/* request lands here
│   ├── _lib/            ← Express app, DB layer, admin auth
│   └── _data/           ← Bundled JSON used to seed a fresh database
├── src/                 ← The Vite + React frontend (the site)
│   ├── pages/           ← Routes: home, work, studio, about, contact, admin
│   ├── components/      ← UI components (cards, layout, decor)
│   ├── data/            ← Bundled JSON (build-time fallback)
│   ├── lib/             ← Brand tokens, content hook
│   └── ...
├── public/              ← Static files served at the site root
├── vercel.json          ← Vercel routing & function settings
├── package.json         ← All dependencies, single npm install
├── vite.config.ts       ← Frontend build config
└── .env.example         ← Required environment variables
```

## API endpoints

All routes live under `/api/`:

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET  | `/api/healthz` | — | Liveness check |
| GET  | `/api/content` | — | All sections (used by the frontend on load) |
| GET  | `/api/content/:section` | — | One section: projects/about/experience/education/gallery |
| POST | `/api/admin/login` | password | Exchange password for a session token |
| POST | `/api/admin/content` | token or password | Save multiple sections at once |
| POST | `/api/admin/content/:section` | token or password | Save one section |
| POST | `/api/contact` | — | Send the contact-form email via Resend |

## Local dev (optional)

```bash
npm install
npm run dev          # serves the frontend on :5173, proxies /api to :3001
# In a second terminal, run any local serverless emulator that exposes
# api/index.ts at http://localhost:3001 (e.g. `vercel dev`).
```

For most edits, deploying directly to a Vercel preview branch is the
easiest workflow — push a commit and Vercel builds a unique URL for it.
