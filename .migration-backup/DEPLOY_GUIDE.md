# Lenna Portfolio — Deploy to Vercel (Beginner Guide)

This guide walks you through publishing your portfolio for free, using:

- **GitHub** — to store the code (free)
- **Neon** — a free Postgres database for your Studio admin edits
- **Resend** — to send the contact form emails (free up to 100/day)
- **Vercel** — to host the live site (free for personal sites)

You will not need to use the command line for any of these steps. Everything
is done through web pages.

When you finish, your site will be live at `lennahua.ca` and you'll be able
to log in to `/admin` to edit your projects and gallery.

---

## Before you start

- You should have downloaded `lenna-portfolio-vercel.zip` (the file you
  received with this guide). Unzip it. You should see a folder called
  `vercel-bundle` (or similar) containing `package.json`, `vercel.json`,
  `api/`, `src/`, and so on.
- You'll need a web browser and an email address.
- Total time: **about 30–45 minutes** for the first deploy.

---

## Step 1 — Create a GitHub account and upload the code

GitHub is where the code lives. Vercel reads it from there.

1. Go to **https://github.com/signup** and create a free account.
   (Use any email and pick a username.)
2. Once logged in, click the green **"+"** button in the top-right corner →
   **"New repository"**.
3. Give it a name like `lenna-portfolio`. Leave it set to **Public**
   (free Vercel only deploys from public repos on the free plan, OR set it
   to Private if you've connected your Vercel account to GitHub — both work).
4. **Don't** tick "Add a README" or any of the other init checkboxes —
   we want an empty repo.
5. Click **Create repository**.
6. On the next page, you'll see a section that says
   *"…or upload an existing file"*. Click that link.
7. Open the unzipped folder on your computer. Drag **all the files and
   folders inside it** (not the parent folder itself) into the GitHub upload
   box. Wait for the upload to finish (a few minutes — there are a lot of
   files).
8. Scroll to the bottom, leave the commit message as the default, and click
   **Commit changes**.

You should now see your code listed on the GitHub repo page.

---

## Step 2 — Get a free Neon database

This is where Lenna's admin edits get saved. Without it, the site still
shows the bundled JSON content, but admin edits won't persist.

1. Go to **https://neon.tech** and click **Sign Up**. Sign in with GitHub
   to make this easier.
2. After signup, Neon walks you through creating a project. Pick:
   - **Project name:** `lenna-portfolio` (or anything)
   - **Postgres version:** the default
   - **Region:** the closest one to you (e.g. `US East (Ohio)`)
3. After creation, you'll land on the project dashboard. On the right
   side you'll see **Connection string**. Make sure the dropdown says
   **Pooled connection** (this is what serverless functions need).
4. Click the **copy** icon next to the long connection string. It looks
   like:
   `postgresql://neondb_owner:abcd1234@ep-foo-bar.us-east-1.aws.neon.tech/neondb?sslmode=require`
5. **Paste it into a temporary note** — you'll need it in Step 5.

You don't need to create any tables. The site does that automatically the
first time it runs. Three tables are created on demand:

- `content_sections` — what `/admin` saves (projects, about, gallery, etc.).
- `contact_messages` — every submission to the contact form. Visible in
  the **Inbox** tab inside `/admin`, with mark-read and delete controls.
- `assets` — metadata for every file you upload through the **Assets**
  tab in `/admin` (filename, size, dimensions, public URL). The actual
  image/video bytes live in Vercel Blob storage (see Step 4b below);
  this table just remembers what was uploaded so the library grid and
  the "Insert from library" pickers work.

---

## Step 3 — Get a free Resend API key

Resend sends the email when someone fills out your contact form.

1. Go to **https://resend.com** and click **Get Started**. Sign in with
   GitHub.
2. After login, go to **API Keys** in the left menu and click
   **Create API Key**.
3. Give it a name like `lenna-portfolio`, leave the permission as
   **Full access** (or **Sending access** if you prefer), and click **Add**.
4. Copy the key it shows you — it starts with `re_`. Paste it into your
   note. **You won't be able to see it again** after closing the dialog.

(Optional later: in Resend's **Domains** section, add and verify
`lennahua.ca` so emails come from `hello@lennahua.ca` instead of
`onboarding@resend.dev`. Not required to launch.)

---

## Step 4 — Create a Vercel account and import the repo

1. Go to **https://vercel.com/signup** and sign up with GitHub.
2. Vercel will ask for permission to read your repos — click **Authorize**.
3. On the dashboard, click **Add New… → Project**.
4. You should see your `lenna-portfolio` repo in the list. Click **Import**.
   (If you don't see it, click **Adjust GitHub App Permissions** and grant
   access to that specific repo.)
5. On the **Configure Project** screen:
   - **Framework Preset:** leave it as **Other** (Vercel will read
     `vercel.json` for the right settings).
   - **Root Directory:** leave as the repo root (don't pick a subfolder).
   - **Build & Output Settings:** leave on the defaults.
   - **Environment Variables:** this is the important part. Add each of
     these by typing the **Name** and pasting the **Value**:

     | Name | Value |
     |------|-------|
     | `DATABASE_URL` | the Neon connection string from Step 2 |
     | `RESEND_API_KEY` | the `re_...` key from Step 3 |
     | `CONTACT_TO_EMAIL` | `lenna.huawork@gmail.com` (or any inbox) |
     | `ADMIN_PASSWORD` | a long random password — **write this down** |
     | `ADMIN_TOKEN_SECRET` | a long random string (32+ chars) |
     | `BLOB_READ_WRITE_TOKEN` | *(strongly recommended)* token for Vercel Blob — see below |

     #### About `BLOB_READ_WRITE_TOKEN` (resume uploads + Assets library)

     Two parts of the admin upload files: the **Files** tab (resume PDF)
     and the **Assets** tab (the central image / video / GIF library that
     all editors pick from). Both need somewhere to put those files.

     - **Recommended:** create a free Vercel Blob store (Vercel dashboard
       → **Storage → Create → Blob**), then copy the
       `BLOB_READ_WRITE_TOKEN` it shows and paste it here. Resume PDFs and
       every file uploaded in the Assets tab go to Blob and are served
       from a fast CDN URL. The free Hobby tier includes 1 GB of storage,
       which is plenty for a portfolio.
     - **If you skip it:** uploads in the Assets tab will fail on Vercel
       (there is no writable disk). The resume PDF still works because it
       falls back to base64 inside the Neon database, but every download
       counts against the Neon egress quota and is slower than Blob.

     On Replit (the local development environment) neither variable is
     needed — files are saved to disk under `uploads/` automatically.
     Vercel Blob only kicks in when `BLOB_READ_WRITE_TOKEN` is set.

     The bundled `Lenna_Hua_Resume.pdf` in the build acts as the
     fallback shown until the first upload happens.

     For `ADMIN_TOKEN_SECRET`, use any password generator
     (e.g. https://1password.com/password-generator/) and pick something
     ~40 characters of letters and numbers.

6. Click **Deploy**. Vercel will install the dependencies and build the
   site. This takes 2–4 minutes. You'll see live build logs.
7. When it finishes, Vercel shows a confetti animation and a link like
   `lenna-portfolio.vercel.app`. Click it — your site is live!

If the build fails, see `TROUBLESHOOTING.md` in this same folder.

---

## Step 5 — Point `lennahua.ca` at Vercel

1. In your Vercel project, go to **Settings → Domains**.
2. Type `lennahua.ca` and click **Add**.
3. Vercel will show you DNS records to add. They look like one of these:

   - **Option A (recommended):** an `A` record pointing `lennahua.ca` to
     `76.76.21.21`.
   - **Option B:** a `CNAME` record pointing `www.lennahua.ca` to
     `cname.vercel-dns.com`.

4. Open a new browser tab and log in to wherever you bought
   `lennahua.ca` (e.g. Namecheap, GoDaddy, Cloudflare, Google Domains).
   Find the **DNS** or **DNS Records** section.
5. Add the records exactly as Vercel showed you. Save.
6. Add `lennahua.ca` AND `www.lennahua.ca` in Vercel — they need separate
   entries. Vercel will pick one as the primary and redirect the other.
7. Wait. DNS changes can take **anywhere from 5 minutes to 24 hours**
   to spread across the internet. Vercel's domain page will show
   ✅ **Valid Configuration** once it sees the change.
8. Once it's green, https://lennahua.ca will load your site, with a
   free SSL certificate (the lock icon) automatically issued by Vercel.

---

## Step 6 — Log in to your Studio admin

1. Go to **https://lennahua.ca/admin** (or your Vercel URL).
2. Type the `ADMIN_PASSWORD` you set in Step 4.
3. You're in! Edit projects, about page, gallery, etc. Click **Save**.
4. Open `https://lennahua.ca/work` in a new tab to confirm your edit
   appears. (Refresh once if it doesn't show right away — the API caches
   for a few seconds.)

---

## Step 7 — Make future content edits

You have two ways to update content:

### Option A — Use the live admin (fastest)

Just go to `/admin`, log in, edit, and save. Changes go straight to the
Neon database and show up on the live site within seconds.

### Option B — Edit the JSON files and re-upload to GitHub

If you want to change the "starting" content (what brand-new visitors see
before the API responds), edit the JSON files in two places and commit:

- `src/data/projects.json` (used by the frontend as fallback)
- `api/_data/projects.json` (used by the API to seed new databases)

Same for `about.json`, `experience.json`, `education.json`, `gallery.json`.

To upload changes via GitHub's web UI:
1. Open the file in your repo (e.g. `src/data/projects.json`).
2. Click the pencil ✏️ icon, edit, and click **Commit changes**.
3. Vercel automatically rebuilds and redeploys (~2 minutes).

> Note: edits made through `/admin` save to the database and override the
> JSON files. If you want to "reset" a section back to the JSON, you can
> delete its row from Neon's SQL editor:
> `DELETE FROM content_sections WHERE name = 'projects';`

---

## What it costs

Everything in this guide is on the free tier:

| Service | Free tier limit | What you get |
|---------|-----------------|--------------|
| GitHub | Unlimited public repos | Code hosting |
| Neon  | 0.5 GB storage, ~190 hours active/month | Postgres database |
| Resend | 100 emails / day | Contact form delivery |
| Vercel (Hobby) | 100 GB bandwidth/month, unlimited builds | Site hosting + SSL |

For a personal portfolio, you're nowhere near any of these limits. You'll
only ever pay if traffic gets very large or if you need a custom Resend
domain (one-time domain cost, not Resend's).

---

## You're done!

If anything didn't work, open `TROUBLESHOOTING.md` in this same folder
for the most common fixes.
