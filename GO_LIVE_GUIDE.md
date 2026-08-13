# 🚀 GO LIVE GUIDE — GrowthMatrix

**What this file is:** a step-by-step runbook that takes this repo from "works on my machine"
to a **live, public SaaS on the internet**, written so that:

- **A human with zero DevOps experience** can follow it (every click is spelled out).
- **Claude (Opus 4.8) can execute it.** Open a Claude Code session in this repo and say:
  > "Read GO_LIVE_GUIDE.md and execute Phase 2"
  Claude does every step marked 🤖. You do every step marked 👤 (those need *your*
  browser, *your* accounts, *your* credit card — an AI cannot and must not do them).

**Rules for Claude executing this guide:**
1. Execute ONE phase at a time, in order. Verify the checkpoint at the end of a phase before moving on.
2. When you hit a `⏸ STOP` box, stop and ask the human for the value it describes. Never invent keys, URLs, or secrets.
3. Never commit `.env` or any file containing a real secret. Check `git status` before every commit.
4. If a command fails, read the error, fix the cause, and re-run — don't skip.
5. Tick the checklist below (edit this file) as phases complete.

---

## Progress checklist

- [ ] Phase 1 — Code on GitHub
- [ ] Phase 2 — Proper database migrations
- [ ] Phase 3 — Production database (Neon)
- [ ] Phase 4 — Prep the repo for Vercel
- [ ] Phase 5 — Deploy to Vercel
- [ ] Phase 6 — Smoke-test the live app
- [ ] Phase 7 — Custom domain (optional)
- [ ] Phase 8 — Password reset emails (strongly recommended)
- [ ] Phase 9 — Login rate limiting (recommended)
- [ ] Phase 10 — What to build next (invites, member portal, billing)

**Accounts you will create along the way (all have free tiers):**
| Service | For | URL |
|---|---|---|
| GitHub | storing the code | github.com |
| Neon | production Postgres database | neon.tech |
| Vercel | hosting the app | vercel.com |
| Resend | sending password-reset emails (Phase 8) | resend.com |

---

## Phase 1 — Put the code on GitHub

Right now the code only exists locally. If this machine dies, the app is gone.

### 1.1 👤 Create an empty GitHub repository
1. Go to **https://github.com** and sign in (or create an account).
2. Click the **+** in the top-right → **New repository**.
3. Repository name: `growthmatrix` (or anything you like).
4. Visibility: **Private**.
5. **IMPORTANT: do NOT tick** "Add a README", "Add .gitignore", or "Choose a license". The repo must be completely empty.
6. Click **Create repository**.
7. Copy the repo URL from the page. It looks like: `https://github.com/YOURNAME/growthmatrix.git`

### 1.2 👤 Create a token so the terminal can push
1. Go to **https://github.com/settings/tokens** → **Generate new token** → **Generate new token (classic)**.
2. Note: `growthmatrix push`. Expiration: 90 days. Scopes: tick **repo** (the whole section).
3. Click **Generate token** and **copy it now** (it's shown only once). It looks like `ghp_xxxxxxxx`.

> ⏸ **STOP** — Claude needs two values from you before continuing:
> 1. The repo URL from step 1.1
> 2. The token from step 1.2

### 1.3 🤖 Push the code
```bash
cd <repo-root>
# Make sure no secrets are about to be committed:
git check-ignore .env || echo "DANGER: .env is not ignored — fix .gitignore first"

# Add the remote (token goes in the URL; replace both placeholders):
git remote add origin https://<TOKEN>@github.com/<YOURNAME>/growthmatrix.git

# Push the branch:
git push -u origin feat/growthmatrix-saas

# Also publish it as the main branch so Vercel can use it:
git checkout -b main 2>/dev/null || git checkout main
git merge feat/growthmatrix-saas --ff-only 2>/dev/null || git reset --hard feat/growthmatrix-saas
git push -u origin main
```
> Note: the token is stored in `.git/config` on this machine only — that file is never
> pushed. Fine for now; delete the token from GitHub when you're done with this guide.

**✅ Checkpoint:** open `https://github.com/YOURNAME/growthmatrix` in the browser — you should
see the code (`src/`, `prisma/`, `package.json`…). If the page shows the files, Phase 1 is done.

---

## Phase 2 — Proper database migrations

**Why:** the schema was applied with `prisma db push` (a dev shortcut). Production needs
**migration files** — versioned SQL scripts — so any fresh database can be built identically.

### 2.1 🤖 Make sure local Postgres is running
```bash
pg_isready || pg_ctlcluster 16 main start   # (on this container; on another machine, start Postgres however it's installed)
pg_isready                                   # must print "accepting connections"
```

### 2.2 🤖 Generate the baseline migration
```bash
cd <repo-root>
mkdir -p prisma/migrations/0_init
npx prisma migrate diff \
  --from-empty \
  --to-schema-datamodel prisma/schema.prisma \
  --script > prisma/migrations/0_init/migration.sql

# Tell Prisma the local DB already has this applied (it does — via db push):
npx prisma migrate resolve --applied 0_init
```

### 2.3 🤖 Verify and commit
```bash
npx prisma migrate status        # must say: "Database schema is up to date!"
head -5 prisma/migrations/0_init/migration.sql   # should show CREATE TYPE / CREATE TABLE statements
git add prisma/migrations
git commit -m "Add baseline Prisma migration"
git push origin main
```

**✅ Checkpoint:** `npx prisma migrate status` reports up-to-date, and
`prisma/migrations/0_init/migration.sql` exists and is full of `CREATE TABLE` statements.

> From now on, any schema change is done with `npx prisma migrate dev --name describe_the_change`
> (never `db push` again).

---

## Phase 3 — Production database (Neon)

**Why:** the app needs a Postgres database that lives in the cloud, not in this container.
Neon has a genuinely free tier and works perfectly with Vercel + Prisma.

### 3.1 👤 Create the database
1. Go to **https://neon.tech** → **Sign up** (easiest: "Continue with GitHub").
2. Click **Create project**.
   - Name: `growthmatrix`
   - Postgres version: **16**
   - Region: pick the one closest to your users (e.g. Frankfurt for Europe).
3. After it creates, you land on the dashboard. Find the **Connection string** box.
4. There is a toggle/checkbox for **"Pooled connection"**. You need **BOTH** strings:
   - With pooling **ON** → this is your `DATABASE_URL`. The host contains `-pooler`.
   - With pooling **OFF** → this is your `DIRECT_URL`. Same but without `-pooler`.
5. Both look like:
   `postgresql://user:password@ep-something-pooler.region.aws.neon.tech/neondb?sslmode=require`

> ⏸ **STOP** — Claude needs both connection strings (pooled and direct) before continuing.
> Paste them to Claude in the chat. They contain a password — that's expected; they will only
> be stored in Vercel's encrypted settings and your local `.env` (which is git-ignored).

### 3.2 🤖 Teach Prisma about the two URLs
Edit `prisma/schema.prisma` — change the `datasource` block to exactly:
```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```
Then edit the local `.env` and add a `DIRECT_URL` line pointing at the same local database:
```
DIRECT_URL="postgresql://gm_app:gm_dev_password@127.0.0.1:5432/growthmatrix?schema=public"
```
Verify nothing broke locally:
```bash
npx prisma generate && npx prisma migrate status   # still "up to date"
npx tsc --noEmit                                    # still 0 errors
git add prisma/schema.prisma
git commit -m "Support pooled + direct database URLs for production"
git push origin main
```

**✅ Checkpoint:** Neon project exists, you have both URLs saved somewhere safe,
`migrate status` still passes locally.

---

## Phase 4 — Prep the repo for Vercel

**Why:** two small things Vercel needs: (a) generate the Prisma client during install,
(b) run migrations against the production DB during every deploy.

### 4.1 🤖 Add build hooks to `package.json`
Add these two lines inside `"scripts"` (keep all existing scripts):
```json
"postinstall": "prisma generate",
"vercel-build": "prisma migrate deploy && next build"
```
(Vercel automatically uses `vercel-build` instead of `build` when it exists.)

### 4.2 🤖 Create `.env.example` (documentation for humans; contains NO real secrets)
Create the file `.env.example` with exactly:
```
# Postgres — pooled connection (Neon: host contains "-pooler")
DATABASE_URL="postgresql://user:password@host/db?sslmode=require"
# Postgres — direct connection (Neon: same host without "-pooler"); used for migrations
DIRECT_URL="postgresql://user:password@host/db?sslmode=require"
# Session signing secret — generate with:  openssl rand -base64 32
AUTH_SECRET="change-me"
```

### 4.3 🤖 Verify and commit
```bash
npm install                       # runs postinstall — must succeed
npm run build                     # full production build — must succeed
git add package.json package-lock.json .env.example
git status                        # MUST NOT list .env
git commit -m "Add Vercel build hooks and env template"
git push origin main
```

**✅ Checkpoint:** `npm run build` succeeds locally and the push is on GitHub.

---

## Phase 5 — Deploy to Vercel

### 5.1 🤖 Generate the production session secret
```bash
openssl rand -base64 32
```
Copy the output — this is your production `AUTH_SECRET`. Give it to the human.

### 5.2 👤 Create the Vercel project
1. Go to **https://vercel.com** → **Sign up** → **Continue with GitHub** (this links your repos).
2. Click **Add New…** → **Project**.
3. Find `growthmatrix` in the list → **Import**. (If it's not listed, click "Adjust GitHub App Permissions" and grant access to the repo.)
4. Leave **Framework Preset** = Next.js and **Root Directory** = `./` (defaults are correct).
5. Open the **Environment Variables** section and add these **three** variables
   (paste values exactly, no quotes):

   | Name | Value |
   |---|---|
   | `DATABASE_URL` | the **pooled** Neon string (host contains `-pooler`) |
   | `DIRECT_URL` | the **direct** Neon string (no `-pooler`) |
   | `AUTH_SECRET` | the random string from step 5.1 |

6. Click **Deploy**. Wait ~2 minutes. Confetti = success.
7. Click **Continue to Dashboard** → you'll see your live URL, like
   `https://growthmatrix-xxxx.vercel.app`. **Copy it.**

**If the build fails:** click the failed deployment → read the log. The two usual causes:
- migrations failed → `DIRECT_URL` is wrong (check for typos / missing `sslmode=require`);
- "PrismaClient not generated" → `postinstall` script missing (redo Phase 4.1).
Paste the log to Claude and it will diagnose.

**✅ Checkpoint:** opening the Vercel URL shows the GrowthMatrix **login page**.

---

## Phase 6 — Smoke-test the live app

### 6.1 👤 Walk through the whole product once (on the live URL)
1. Open `https://<your-app>.vercel.app` → you should be redirected to **/login**.
2. Click **Create a workspace** → fill in your name, org name, email, password (8+ chars) → **Create workspace**.
3. You land on the Team page onboarding. Click **Load PM starter framework** → toast confirms.
4. Click **+ Add member** → add a real teammate (pick role + level) → they appear in the table.
5. Click the member → their **Profile** loads with a radar chart.
6. Go to **Skills (rate)** → click some dots → scores change instantly.
7. Go to **History & log** → your rating changes are logged.
8. Press **⌘⇧L** (Mac) / **Ctrl+Shift+L** (Windows) → quick capture opens → type a note mentioning the member's first name → save → check **Capture inbox**.
9. **The real test:** close the browser completely, reopen the URL, log back in → everything is still there.

### 6.2 👤 Check tenant isolation (2 minutes, worth it)
1. Open a **private/incognito window** → same URL → create a **second** workspace with a different email.
2. This second workspace must be **completely empty** — no members, no framework from the first one.
3. If you can see the first workspace's data here, STOP and tell Claude — that's a critical bug (it isn't expected; the code scopes everything by organization).

**✅ Checkpoint:** data persists across sessions and workspaces can't see each other.
**🎉 You are live on the internet.** Everything below makes it *better*.

---

## Phase 7 — Custom domain (optional)

1. 👤 Buy a domain anywhere (Namecheap, Cloudflare, GoDaddy — ~$10/yr).
2. 👤 In Vercel: your project → **Settings** → **Domains** → **Add** → type `yourdomain.com`.
3. 👤 Vercel shows you 1–2 DNS records (an `A` record and/or `CNAME`). Copy them.
4. 👤 In your domain registrar's DNS settings, add exactly those records.
5. Wait 5–30 minutes. Vercel's Domains page turns green and issues HTTPS automatically.

**✅ Checkpoint:** `https://yourdomain.com` shows the login page with a padlock.

---

## Phase 8 — Password reset emails (strongly recommended)

**Why:** right now a user who forgets their password is locked out forever.

### 8.1 👤 Create a Resend account
1. Go to **https://resend.com** → sign up (free tier: 100 emails/day, plenty).
2. **API Keys** → **Create API Key** → name `growthmatrix` → copy the key (`re_...`).
3. If you did Phase 7: **Domains** → **Add Domain** → follow the DNS steps so emails come
   from `noreply@yourdomain.com`. If you skipped Phase 7, you can send from
   `onboarding@resend.dev` for testing only.
4. In Vercel → project → **Settings** → **Environment Variables**, add:
   - `RESEND_API_KEY` = your key
   - `EMAIL_FROM` = `GrowthMatrix <noreply@yourdomain.com>` (or `onboarding@resend.dev`)
   - `APP_URL` = your live URL, e.g. `https://yourdomain.com` (no trailing slash)

> ⏸ **STOP** — Claude needs to know these three env vars are set in Vercel (and needs the
> values added to local `.env` for testing) before building.

### 8.2 🤖 Build it (implementation spec)
This is a coding task. Follow the repo's existing conventions (see `src/app/api/auth/*`,
`src/app/(auth)/*`, `src/lib/*`). Steps:

1. `npm install resend`
2. **Schema** — add to `prisma/schema.prisma`:
   ```prisma
   model PasswordResetToken {
     id        String   @id @default(cuid())
     tokenHash String   @unique          // sha256 of the token; never store raw
     userId    String
     user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
     expiresAt DateTime
     usedAt    DateTime?
     createdAt DateTime @default(now())
     @@index([userId])
   }
   ```
   and `resetTokens PasswordResetToken[]` on `User`. Then:
   `npx prisma migrate dev --name password_reset_tokens`
3. **Mailer** — `src/lib/email.ts`: thin wrapper around Resend's SDK,
   `sendPasswordResetEmail(to, resetUrl)` with a plain, decent-looking HTML body.
4. **API** `POST /api/auth/forgot` `{email}`:
   - Always return `{ok:true}` (never reveal whether the email exists).
   - If the user exists: generate 32 random bytes (hex), store the **sha256 hash** with
     `expiresAt = now + 1h`, email the link `${APP_URL}/reset-password?token=<raw>`.
5. **API** `POST /api/auth/reset` `{token, password}`:
   - Hash the token, look it up; reject if missing/expired/used (`400`, generic message).
   - Validate password ≥ 8 chars. Update `passwordHash` (reuse `hashPassword`),
     set `usedAt`, delete the user's other outstanding tokens.
6. **Pages** (match the existing `AuthForm` visual style):
   - `/forgot-password` — email field → posts to forgot → always shows
     "If that email has an account, we sent a reset link."
   - `/reset-password` — reads `?token=`, two password fields → posts to reset →
     success links to `/login`.
   - Add a "Forgot password?" link on the login form.
7. **Verify:** `npx tsc --noEmit` → 0 errors; `npm run build` → succeeds; then locally run
   the flow end-to-end (with real `RESEND_API_KEY` in `.env`) and confirm the email arrives
   and the new password works.
8. Commit + push → Vercel auto-deploys.

**✅ Checkpoint:** 👤 On the live site: "Forgot password?" → receive email → set new
password → log in with it.

---

## Phase 9 — Login rate limiting (recommended)

**Why:** without it, a bot can guess passwords all day.
**Approach:** track failed attempts in Postgres (no new services needed; fine at this scale).

### 9.1 🤖 Build it (implementation spec)
1. **Schema** — add:
   ```prisma
   model LoginAttempt {
     id        String   @id @default(cuid())
     key       String                     // lowercased email
     createdAt DateTime @default(now())
     @@index([key, createdAt])
   }
   ```
   `npx prisma migrate dev --name login_attempts`
2. In `POST /api/auth/login`, **before** checking the password:
   - Count `LoginAttempt` rows for this email in the last 15 minutes.
   - If ≥ 5 → return `429` `{error:"Too many attempts. Try again in 15 minutes."}`.
   - On **failed** login → insert a row. On **success** → delete the email's rows.
3. Show the 429 message in the login form (it already displays API `error` strings).
4. Best-effort cleanup: when inserting, also delete rows older than 1 day for that key.
5. Verify: 5 wrong passwords → 6th attempt returns 429 even with the *correct* password;
   after 15 min (or after deleting the rows manually) login works. `tsc` + build pass.
   Commit + push.

**✅ Checkpoint:** hammering the login form locks the account name for 15 minutes.

---

## Phase 10 — What to build next (in order of value)

These are larger features. Each can be given to Claude as its own task; one PR each.

1. **Invite other managers** — an `Invitation` model (email, token, orgId, role, expiresAt),
   "Invite teammate" button in the header menu, email via Resend, `/accept-invite` page that
   creates a `User` in the **existing** org. Unlocks: multiple managers per workspace.
2. **Member self-assessment portal** — give `Member` an optional login (or magic link),
   a stripped-down view where they rate only their own skills into `Score.self`.
   Unlocks: the Self-vs-manager screen fills itself.
3. **Billing (Stripe)** — `stripeCustomerId` + `plan` on `Organization`, Stripe Checkout
   for a monthly plan, webhook → set plan, gate "Add member" above N members on free tier.
   Use Stripe's test mode first.
4. **Review cycles that actually snapshot** — "Close cycle" copies all current scores into
   a `ScoreSnapshot` table; trend arrows then compare live vs. last snapshot.
5. **CSV import/export** — import members/skills from a spreadsheet; export any table.
6. **Slack capture** — a Slack app whose message-shortcut posts into `/api/inbox`.

---

## Appendix — Things that keep you out of trouble

- **Never commit `.env`.** It's git-ignored; keep it that way. Secrets live in Vercel env vars.
- **Rotate that GitHub token** (Phase 1.2) after setup: GitHub → Settings → Tokens → delete.
- **Backups:** Neon keeps point-in-time restore even on the free tier (Dashboard → Branches →
  Restore). For extra safety: `pg_dump "$DIRECT_URL" > backup.sql` occasionally.
- **Schema changes:** always `npx prisma migrate dev --name <what_changed>` locally, commit the
  new folder in `prisma/migrations/`, push — Vercel applies it on deploy automatically.
- **Logs:** Vercel dashboard → your project → **Logs** shows every server error live.
- **It's down / weird:** Vercel → Deployments → click the previous good deployment →
  **⋯ → Promote to Production** = instant rollback (DB schema rollbacks are *not* automatic —
  that's why migrations stay additive when possible).
