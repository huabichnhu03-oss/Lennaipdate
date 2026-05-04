# Troubleshooting

The most common things that go wrong on a first deploy, and exactly how
to fix each one.

---

## 1. The build fails on Vercel with "Cannot find module …"

**Cause:** files were uploaded to GitHub in the wrong layout (often the
parent folder ended up in the repo, so `package.json` is one folder deep
instead of at the root).

**Fix:** open your GitHub repo. You should see `package.json`,
`vercel.json`, `api/`, `src/`, etc. **at the top level**. If instead you
see one folder (like `vercel-bundle/`) and have to click into it to find
those files, redo Step 1 of `DEPLOY_GUIDE.md` — drag the **contents**
of the unzipped folder into the GitHub upload box, not the folder itself.

---

## 2. The site loads, but `/admin` says "Incorrect password" or "ADMIN_PASSWORD is not configured"

**Cause:** Either `ADMIN_PASSWORD` / `ADMIN_TOKEN_SECRET` are not set on
Vercel, or you're typing a different password than what you saved.
For security, the admin **refuses to log in at all** until both env
vars are set — there is no default password.

**Fix:**
1. Go to Vercel → your project → **Settings → Environment Variables**.
2. Check that **both** `ADMIN_PASSWORD` and `ADMIN_TOKEN_SECRET` are
   listed. If either is missing, add it now (each must be at least 8
   characters; for `ADMIN_TOKEN_SECRET` use 32+ random chars from
   https://1password.com/password-generator/).
3. If you forgot the password, click **Edit** next to `ADMIN_PASSWORD`,
   set a new value, click **Save**.
4. Vercel will tell you to redeploy — click **Redeploy** on the latest
   deployment. Env var changes only take effect after a redeploy.

---

## 3. The contact form returns "Email service is not configured yet"

**Cause:** `RESEND_API_KEY` is not set on Vercel, or the key was revoked.

**Fix:**
1. Go to **https://resend.com → API Keys**. Make sure the key is still
   listed. If not, create a new one.
2. In Vercel → **Settings → Environment Variables**, check that
   `RESEND_API_KEY` is set and starts with `re_`.
3. Redeploy after any change.

---

## 4. Edits in `/admin` don't save (red error message)

**Cause:** the database connection string is missing, wrong, or doesn't
allow connections from the internet.

**Fix:**
1. Go to **https://neon.tech** and open your project. On the right side,
   make sure the connection-string dropdown is set to **Pooled connection**
   (NOT "Direct connection") — Vercel serverless functions require this.
2. Copy the full string, including the `?sslmode=require` part at the end.
3. In Vercel → **Settings → Environment Variables**, click **Edit** on
   `DATABASE_URL`, paste the full string, click **Save**.
4. Redeploy.

To double-check the database is reachable: in Vercel, open your latest
deployment → **Functions** tab → click on `api/index` → look for any
"DATABASE_URL is not set" or "ECONNREFUSED" errors in the logs.

---

## 5. `lennahua.ca` doesn't load (or shows a "not configured" page)

**Cause:** DNS hasn't propagated yet, or the records were entered wrong.

**Fix:**
1. Go to **https://dnschecker.org** and type `lennahua.ca`. If most of
   the locations show ❌ or different IPs, your DNS records haven't
   spread yet — wait 1–4 hours and try again.
2. In Vercel → **Settings → Domains**, look at the status next to
   `lennahua.ca`. It should say ✅ **Valid Configuration**. If it says
   **Invalid Configuration**, click it for the exact records you need to
   add at your domain registrar.
3. Common slip: forgetting to add `www.lennahua.ca` as a separate entry
   in Vercel. The "www" version needs its own line.

---

## 6. Site renders but images/styles look broken

**Cause:** the build succeeded but there was a runtime issue, OR the
browser is showing a cached old version.

**Fix:**
1. Hard refresh: hold **Shift** and click the reload button (or
   **Cmd+Shift+R** on Mac, **Ctrl+F5** on Windows).
2. If still broken, open the browser DevTools (right-click → Inspect →
   Console tab) and look for red errors. The most likely culprit is a
   missing image URL — use the admin to fix the broken image, or replace
   the `coverImage` field in the relevant JSON.

---

## 7. "Module not found: @neondatabase/serverless" or similar in the build log

**Cause:** dependency install on Vercel skipped or partially failed.

**Fix:**
1. Go to your latest Vercel deployment → click **Redeploy**.
2. In the redeploy dialog, **uncheck** "Use existing build cache" — this
   forces a clean install.
3. Click **Redeploy**.

---

## 8. Admin saves succeed but the homepage doesn't update

**Cause:** the page is showing the bundled fallback while the API
hydration happens. Should resolve on its own after a second.

**Fix:**
1. Refresh the page once.
2. Open DevTools → Network tab → look for `/api/content`. It should
   return a 200 with JSON. If it returns 500, check the function logs
   in Vercel for the underlying error (usually a DB issue — see #4).

---

## 9. Vercel says "Build exceeded maximum duration"

Very rare, but if a deploy takes more than ~10 minutes:

**Fix:**
1. Likely an unusually large image somewhere in the JSON files (the
   admin lets you paste base64 images, which inflate the bundle size).
2. Open the affected JSON in GitHub, find the giant `data:image/png;base64,...`
   string, and replace it with a normal URL hosted elsewhere
   (e.g. Cloudinary's free tier or Imgur).
3. Commit and Vercel will retry.

---

## Still stuck?

The two most useful places to look when something breaks:

- **Vercel → your deployment → "Functions" tab** — runtime errors from
  the API.
- **Browser DevTools → Console** — runtime errors from the frontend.

Copy the exact error message into a Google search; almost every Vercel
error has a matching Stack Overflow / Vercel community thread.
