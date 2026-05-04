// Vercel serverless entry. The `vercel.json` rewrites every `/api/*`
// request to this file, and Express's router matches the original
// `/api/...` path inside the app. One handler, every endpoint.
import { createApp } from "./_lib/app";

const app = createApp();

export default app;
