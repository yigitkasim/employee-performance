# 🚀 GO LIVE GUIDE — GrowthMatrix (v3)

**What this file is:** a step-by-step runbook that takes this repo from "works on my machine"
to a **live, paying-customer-ready SaaS**, written so that:

- **A human with zero DevOps experience** can follow it (every click is spelled out).
- **A Claude agent can execute it.** Open a Claude Code session in this repo and say:
  > "Read GO_LIVE_GUIDE.md and execute Phase 1"

  Claude does every step marked 🤖. You do every step marked 👤 (those need *your*
  browser, *your* accounts, *your* card — an AI cannot and must not do them).

**Rules for the agent executing this guide:**
1. Execute ONE phase at a time, in order. Never continue past a failed ✅ VERIFY — diagnose, fix, re-verify.
2. At a `⏸ STOP` box, stop and ask the human for the value described. Never invent keys, URLs, or secrets.
3. Secrets (`sk_…`, `re_…`, tokens, DB URLs) go ONLY into the hosting provider's env-var UI or the local `.env` (git-ignored). Never into code, git, or logs.
4. Tick the checklist below as phases complete.

> ### ⚠️ READ THIS FIRST — why Phase 1 is not optional
> This project was once lost completely because it lived only inside a temporary
> cloud container with no git remote. When the container recycled, everything went
> with it. It was recoverable only from session transcripts. **Do Phase 1 before
> anything else.** Code that exists in exactly one place does not really exist.

---

## Progress checklist

- [ ] **Phase 0** — Pre-flight quality gate (5 min, local)
- [ ] **Phase 1** — Code on GitHub ← *do this first, today*
- [ ] **Phase 2** — Production database (Neon)
- [ ] **Phase 3** — Deploy to Vercel
- [ ] **Phase 4** — Smoke-test the live app
- [ ] **Phase 5** — Custom domain
- [ ] **Phase 6** — Email delivery (Resend) — required for real users
- [ ] **Phase 7** — Automated weekly backups
- [ ] **Phase 8** — Legal & compliance switch-on (EU / UK / TR / US / CA)
- [ ] **Phase 9** — Billing with Stripe (only when you're ready to charge)
- [ ] **Phase 10** — What to build next

**Accounts you'll create (all have free tiers):**

| Service | For | Cost |
|---|---|---|
| GitHub | code, CI, weekly backups | free |
| Neon | production Postgres | free tier fine |
| Vercel | hosting | free Hobby to start |
| Resend | verification & password-reset email | free: 100/day |
| Stripe *(Phase 9)* | subscriptions | % of sales |
| A domain | your address | ~$10/yr |

---

## ✅ What is already built (you do NOT need to build these)

The app is feature-complete for a first launch. Already working and verified end-to-end:

- **Auth:** signup/login/logout, bcrypt(12) hashes, signed httpOnly JWT session cookie.
- **Email verification** — token emailed at signup, in-app banner with resend.
- **Password reset** — single-use SHA-256-hashed token, 1-hour expiry, reuse rejected.
- **Login lockout** — 5 failed attempts per email / 15 min → `429`.
- **Session revocation** — a password reset invalidates every existing cookie everywhere (pages *and* APIs).
- **Multi-tenancy** — every row is scoped to an Organization; all queries filter by the session's org.
- **Security headers** — CSP, HSTS, X-Frame-Options: DENY, nosniff, Referrer-Policy, Permissions-Policy.
- **GDPR/KVKK/CCPA/PIPEDA:** `/terms`, `/privacy`, `/dpa` pages; required consent at signup; a separate opt-in for marketing; **"Download my data"** (full JSON export); **"Delete account"** (password-confirmed, removes the whole workspace when you're its last user); audit logging.
- **The product itself** — 13 screens: Team, Profile, Skills (rate), Skill gaps, Growth simulator, Self vs manager, Compare, Promotion, 1:1 prep, History & log, Capture inbox, Roles & skills framework, Account & privacy.
- **Migrations** (`prisma/migrations/`), **CI** (`.github/workflows/ci.yml`), **weekly backups** (`.github/workflows/backup.yml`), **13 unit tests**, and a clean `npm audit`.

**Not built yet:** billing (Phase 9), inviting other managers, a login for the team members themselves, and the Slack/CSV integrations (they show an honest "not available yet" toast).

---

## Phase 0 — Pre-flight quality gate

🤖 Run all four checks from the repo root. Every one must pass before you deploy anything.

```bash
npx tsc --noEmit && npm run lint && npm test && npm audit --omit=dev
```

✅ **VERIFY:** typecheck prints nothing · lint prints nothing · `13 passed` (or more) · `found 0 vulnerabilities`.

Then confirm a production build succeeds:

```bash
npm run build
```

✅ **VERIFY:** ends with a route table and no red errors.
> If it fails with `Cannot find module for page: /_not-found`, a `next dev` server is
> running and fighting over `.next`. Stop it (`pkill -f "next dev"`), `rm -rf .next`, rebuild.

---

## Phase 1 — Put the code on GitHub

### 1.1 👤 Create an empty private repository
1. **https://github.com** → **+** (top right) → **New repository**.
2. Name: `growthmatrix`. Visibility: **Private**.
3. **Do NOT tick** "Add a README", ".gitignore", or "license" — the repo must be empty.
4. **Create repository**, then copy the URL: `https://github.com/YOURNAME/growthmatrix.git`

### 1.2 👤 Create a push token
1. **https://github.com/settings/tokens** → **Generate new token (classic)**.
2. Note: `growthmatrix push` · Expiration: 90 days · Scope: tick **repo**.
3. **Generate**, then **copy it now** (shown once). Looks like `ghp_…`.

> ⏸ **STOP** — the agent needs (1) the repo URL and (2) the token before continuing.

### 1.3 🤖 Push
```bash
cd /home/claude/repo
git check-ignore .env && echo "SAFE: .env ignored"     # must print SAFE
git status --short | grep -E "\.env$" && echo "DANGER" || echo "no secrets staged"

git remote add origin https://<TOKEN>@github.com/<YOURNAME>/growthmatrix.git
git branch -M main
git push -u origin main
```

✅ **VERIFY:** refresh the GitHub page — `src/`, `prisma/`, `package.json` are there, and the
**Actions** tab shows a **CI** run going green. A red X on a future commit means: don't deploy it.

👤 After setup, delete that token at github.com/settings/tokens (it's stored in `.git/config` locally).

---

## Phase 2 — Production database (Neon)

The local Postgres dies with the machine; Neon is hosted and free to start.

### 2.1 👤 Create it
1. **https://neon.tech** → sign up (easiest: Continue with GitHub) → **Create project**.
2. Name `growthmatrix` · Postgres **16** · region closest to your users (e.g. Frankfurt).
3. On the dashboard find **Connection string**. You need **BOTH** forms:
   - **Pooled** (host contains `-pooler`) → this is `DATABASE_URL`
   - **Direct** (no `-pooler`) → this is `DIRECT_URL`
4. Both end with `?sslmode=require`.

> ⏸ **STOP** — the agent needs both connection strings. They contain a password; they go
> only into Vercel's encrypted env vars and your local `.env`.

✅ **VERIFY:** 🤖 `npx prisma migrate status` against the Neon URL reports the migration list
(no schema setup needed — `prisma migrate deploy` runs automatically on every Vercel build).

---

## Phase 3 — Deploy to Vercel

### 3.1 🤖 Generate the production session secret
```bash
openssl rand -base64 32
```
Give the output to the human — it's `AUTH_SECRET`. (Changing it later logs everyone out.)

### 3.2 👤 Import the project
1. **https://vercel.com** → sign up with the **same GitHub account** → **Add New… → Project**.
2. Find `growthmatrix` → **Import**. (Not listed? "Adjust GitHub App Permissions" → grant access.)
3. Framework auto-detects **Next.js**; leave **Root Directory** as `./`.
4. Open **Environment Variables** and add (Production scope):

| Name | Value |
|---|---|
| `DATABASE_URL` | the **pooled** Neon string |
| `DIRECT_URL` | the **direct** Neon string |
| `AUTH_SECRET` | the value from 3.1 |
| `APP_URL` | your future URL, e.g. `https://growthmatrix.vercel.app` (no trailing slash) |
| `ADMIN_EMAILS` | your email — grants owner access |
| `COMPANY_NAME` | the entity named on the legal pages |
| `COMPANY_CONTACT_EMAIL` | a mailbox you actually read (privacy requests land here) |
| `RESEND_API_KEY` | leave empty for now — Phase 6 |
| `EMAIL_FROM` | leave empty for now — Phase 6 |

5. **Deploy** and wait ~2 minutes.

**If the build fails**, open the failed deployment → read the log:
- migrations failed → `DIRECT_URL` typo or missing `?sslmode=require`
- "PrismaClient not generated" → the `postinstall` script was removed from package.json

✅ **VERIFY:** the Vercel URL shows the GrowthMatrix **login page**.

---

## Phase 4 — Smoke-test the live app

### 4.1 🤖 Automated checks (substitute your real URL)
```bash
URL=https://YOURDOMAIN
curl -sI $URL/login | grep -iE "content-security-policy|strict-transport|x-frame-options"
for p in /login /signup /terms /privacy /dpa; do
  echo "$p -> $(curl -s -o /dev/null -w '%{http_code}' $URL$p)"
done
echo "protected: $(curl -s -o /dev/null -w '%{http_code}' $URL/app)"          # expect 307
echo "api guard: $(curl -s -o /dev/null -w '%{http_code}' $URL/api/account/export)"  # expect 401
```
✅ **VERIFY:** three security headers present · five `200`s · `307` · `401`.

### 4.2 👤 Walk the product once, in a browser
1. **Create a workspace** — note the signup won't submit until you tick the Terms box (that's the compliance gate working).
2. You land on the Team page. Click **Load PM starter framework**.
3. **+ Add member** → add someone with a role + level → they appear in the table.
4. Click them → **Profile** renders with a radar chart.
5. **Skills (rate)** → click dots → scores change instantly.
6. **History & log** → your rating changes are listed.
7. Press **⌘⇧L** (Mac) / **Ctrl+Shift+L** → quick capture → mention the member's first name → save → check **Capture inbox**.
8. Avatar menu → **Account & privacy** → **Download my data** → a JSON file downloads containing your org.
9. Close the browser entirely, reopen, log back in — everything is still there.

### 4.3 👤 Verify tenant isolation (2 minutes, do not skip)
Open a **private/incognito** window → create a **second** workspace with a different email.
✅ **VERIFY:** it is completely empty — no members, no framework. If you can see the first
workspace's data, stop and report it.

🎉 **You are live.** Everything below hardens and monetizes it.

---

## Phase 5 — Custom domain

1. 👤 Buy a domain (Namecheap / Cloudflare, ~$10/yr).
2. 👤 Vercel → project → **Settings → Domains** → **Add** → your domain.
3. 👤 Copy the DNS records Vercel shows into your registrar's DNS settings.
4. 👤 Wait 5–30 min → Vercel turns green and issues HTTPS automatically.
5. 👤 Update the `APP_URL` env var to the new domain → **Redeploy**.
   *(Email links use `APP_URL`; if it's stale, reset links point at the wrong host.)*

✅ **VERIFY:** `https://yourdomain.com` loads with a padlock.

---

## Phase 6 — Email delivery (required before real users)

Until this is set, verification and password-reset links are only written to the server log —
so a locked-out user stays locked out.

### 6.1 👤 Resend setup
1. **https://resend.com** → sign up (free: 100 emails/day).
2. **Domains → Add Domain** → your domain → add the SPF/DKIM DNS records at your registrar → wait for **Verified**.
3. **API Keys → Create API Key** → copy it (`re_…`).
4. Vercel → **Settings → Environment Variables**:
   - `RESEND_API_KEY` = the key
   - `EMAIL_FROM` = `GrowthMatrix <no-reply@yourdomain.com>` *(the domain after @ must be the verified one)*
5. **Redeploy**.

✅ **VERIFY:** 👤 On the live site: **Forgot your password?** → the email arrives (check spam) →
the link opens the reset page → set a new password → sign in with it. Then confirm the **old**
password no longer works.

---

## Phase 7 — Automated weekly backups

The workflow already exists at `.github/workflows/backup.yml`; it needs one secret.

1. 👤 GitHub repo → **Settings → Secrets and variables → Actions → New repository secret**
   - Name: `DIRECT_URL` · Value: the **direct** Neon connection string.
2. 👤 **Actions** tab → **Weekly DB backup** → **Run workflow** (manual first run).

✅ **VERIFY:** the run goes green and a `db-backup-…` artifact appears. It then runs every
Monday and keeps 90 days.

> Neon also has point-in-time restore built in (Dashboard → Branches → Restore).

---

## Phase 8 — Legal & compliance switch-on

The technical work is done. These are the human decisions.

- [ ] 👤 **Have a lawyer review `/terms` and `/privacy` before serious marketing spend.** They are solid, product-specific drafts — not legal advice.
- [ ] 👤 Fill the placeholders: governing law/venue (Terms §12) and subscription terms (§6). Edit `src/app/(legal)/terms/page.tsx`.
- [ ] 👤 Set `COMPANY_NAME`, `COMPANY_CONTACT_EMAIL` (and `COMPANY_ADDRESS`) in Vercel to your real entity. If you form a company later, update these and Stripe.
- [ ] 👤 **EU/UK:** if you have no EU establishment, GDPR Art. 27 may require an EU representative (and a UK one). Ask the lawyer.
- [ ] 👤 **Turkey (KVKK):** if you process data in Turkey at scale, check whether **VERBİS** registration applies to you.
- [ ] ✅ Confirm on the live site: `/terms`, `/privacy`, `/dpa` load; signup blocks without consent; **Download my data** returns your org's JSON; **Delete account** asks for the password and works.
- [ ] ✅ Cookies: the app sets exactly one strictly-necessary session cookie, so no consent banner is needed. **If you ever add analytics or ads, add a consent banner first.**
- [ ] ✅ Email: only transactional mail is sent (verification, reset). Marketing requires the separate opt-in that's already collected at signup — honour it.
- [ ] 👤 **Japan (optional):** if you sell there, ask about a 特定商取引法 (Specified Commercial Transactions Act) disclosure page.

**Security posture you already have:** bcrypt(12) · single-use expiring hashed tokens ·
session revocation on password reset · login lockout · CSP/HSTS/XFO/nosniff ·
org-scoped queries on every route · HTML-escaped email templates · secrets server-side only ·
GDPR export & erasure · audit logging · `npm audit` clean · CI on every push.

---

## Phase 9 — Billing with Stripe

Only when you're ready to charge. This is the one substantial feature still to build.

### 9.1 👤 Stripe test mode
1. **https://stripe.com** → sign up. Keep the **Test mode** toggle ON.
2. **Product catalogue → Add product**: `GrowthMatrix Pro`, two recurring prices (monthly + yearly). Copy both price IDs (`price_…`).
3. **Developers → API keys** → copy the **Secret key** (`sk_test_…`).
4. **Settings → Customer portal → Activate** (this is how customers cancel — skipping it breaks cancellation).

### 9.2 🤖 Build it
Give an agent this scope, as its own task:
- `stripeCustomerId`, `plan`, `subscriptionStatus` on `Organization` (+ migration).
- `POST /api/billing/checkout` → Stripe Checkout session for the chosen price.
- `POST /api/billing/webhook` → **signature-verified**; handle `customer.subscription.created|updated|deleted` → update the org's plan.
- `POST /api/billing/portal` → Customer Portal session; link it from the avatar menu.
- A free-tier limit (e.g. 5 members) enforced **server-side** in `POST /api/members`, with an upgrade prompt in the UI.

### 9.3 👤 Go live with real money
1. Complete Stripe **business activation** (identity + bank account).
2. Switch to **Live mode** and redo: product + prices, secret key, **activate the Customer portal again** (it is configured per-mode), and create the live webhook endpoint → copy its signing secret.
3. Update the Stripe env vars in Vercel → Redeploy.

✅ **VERIFY:** subscribe with a real card on the cheapest plan, confirm the account flips to Pro,
then cancel via the customer portal. It's the only true test of live mode.

---

## Phase 10 — What to build next

1. **Invite other managers** — an `Invitation` model + emailed token + `/accept-invite` that adds a `User` to the *existing* org. (The schema already supports multiple users and an `OWNER`/`MANAGER` role.)
2. **Team-member logins** — let the people being evaluated fill their own self-assessment into `Score.self`; the Self-vs-manager screen then fills itself.
3. **Admin console** — `ADMIN_EMAILS` already marks owners; build `/admin` for customer lookup, suspend/unsuspend (`User.suspendedAt` is enforced at login), GDPR requests, and the audit-log viewer.
4. **Cycle snapshots** — "Close cycle" copies scores into a snapshot table so trends compare real history.
5. **CSV import/export** and the **Slack** capture integration (both currently honest stubs).

---

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| Nobody receives email | `RESEND_API_KEY` unset, or `EMAIL_FROM` domain ≠ verified domain | Phase 6; check Resend logs |
| Reset link goes to the wrong host | `APP_URL` stale after adding a domain | update it in Vercel → Redeploy |
| 500 on every page | `DATABASE_URL` / `DIRECT_URL` wrong | Vercel → Logs; re-copy from Neon |
| Build fails: "Cannot find module for page: /_not-found" | a `next dev` is sharing `.next` | `pkill -f "next dev"`, `rm -rf .next`, rebuild |
| Login returns 429 | lockout working (5 fails / 15 min) | wait 15 min, or clear `LoginAttempt` rows |
| Everyone logged out at once | `AUTH_SECRET` was changed | expected; it invalidates all cookies |
| Users still signed in after a password reset | shouldn't happen — `authed()` uses `getVerifiedSession()` | re-run the Phase 4.1 checks and report |
| Signup won't submit | the Terms checkbox is required | that's the compliance gate |
| CI red on a commit | quality gate failed | open Actions → read the failing step → fix → push |

## Day-to-day operations

- **Schema change:** `npx prisma migrate dev --name what_changed` → commit `prisma/migrations/` → push. Vercel applies it on deploy.
- **Rollback:** Vercel → Deployments → previous good one → **⋯ → Promote to Production**. (DB migrations don't roll back — keep them additive.)
- **Watch:** Vercel → Logs (500s) · Resend → bounces · GitHub → Actions (CI + backups).
- **Monthly:** `npm audit`, take non-breaking updates, let CI verify.
