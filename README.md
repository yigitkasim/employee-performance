# GrowthMatrix

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

An open-source tool for managers to evaluate and grow their team. Define a
skill framework, rate people against it, and see where each person stands and
what to work on next.

Managers define a **skill framework** (roles → levels → skill groups →
sub-skills, plus an expected-score matrix), add **team members**, and rate them
1–5 on every sub-skill. From those ratings the app derives radars, skill-gap
heatmaps, a growth simulator, promotion readiness, self-vs-manager deltas, 1:1
prep, a coaching log, and a quick-capture inbox.

It is a multi-tenant web app: one deployment can host many independent
workspaces, each fully isolated from the others.

## Features

- **13 screens:** Team · Profile · Skills (rate) · Skill gaps · Growth
  simulator · Self vs manager · Compare members · Promotion · 1:1 prep ·
  History & log · Capture inbox · Roles & skills framework · Account & privacy
- **Auth:** email/password signup and login, email verification, password
  reset, login lockout, session revocation on password change
- **Security:** CSRF origin checks, rate limiting, strict security headers
  (CSP, HSTS, frame denial), per-organization data isolation
- **Privacy tooling:** terms / privacy / DPA pages, consent capture,
  "Download my data" JSON export, self-service account deletion, audit log
- **One-click starter framework** for product-manager teams, or build your own

## Stack

- **Next.js 15** (App Router, React 19, TypeScript): frontend and API routes
- **PostgreSQL 16** via **Prisma 6**
- **Tailwind CSS 3** and **Chart.js 4** (radar charts)
- Custom email/password auth: bcrypt hashes and a signed JWT in an httpOnly
  cookie (`jose`)
- **Resend** for transactional email (optional in development)
- **Vitest** for unit tests

## Getting started

### Prerequisites

- Node.js 20 or newer
- A PostgreSQL 16 database you can reach from your machine

### Setup

```bash
git clone https://github.com/yigitkasim/employee-performance.git
cd employee-performance
cp .env.example .env      # then fill in DATABASE_URL, DIRECT_URL and AUTH_SECRET
npm install
npx prisma migrate dev    # creates the schema
npm run dev               # http://localhost:3000
```

Generate `AUTH_SECRET` with `openssl rand -base64 32`. The app refuses to start
without a real secret of at least 32 characters.

Then open the app, **create a workspace**, and either **load the PM starter
framework** (one click on the Team page) or build your own under *Roles &
skills*. The database starts empty by design.

### Environment variables

All variables are documented in [`.env.example`](.env.example).

| Variable | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | yes | Pooled Postgres connection used by the app |
| `DIRECT_URL` | yes | Direct (non-pooled) connection used for migrations |
| `AUTH_SECRET` | yes | Session signing secret, 32+ characters |
| `APP_URL` | yes in production | Public URL, used in email links |
| `RESEND_API_KEY` | no | Without it, verification and reset links are logged to the server console |
| `EMAIL_FROM` | no | Sender address for outgoing email |
| `ADMIN_EMAILS` | no | Comma-separated emails granted owner/superadmin access |
| `COMPANY_NAME`, `COMPANY_CONTACT_EMAIL`, `COMPANY_ADDRESS` | for public deployments | Operator identity shown on `/terms`, `/privacy` and `/dpa` |

### Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` / `npm start` | Production build and server |
| `npm test` | Unit tests (Vitest) |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript, no emit |
| `npm run db:migrate` | Create and apply a Prisma migration |
| `npm run db:studio` | Browse the database in Prisma Studio |

## Deploying

[`GO_LIVE_GUIDE.md`](GO_LIVE_GUIDE.md) is a step-by-step runbook for running
your own instance on Neon (Postgres), Vercel (hosting) and Resend (email),
including a custom domain, backups, and the legal pages.

If you host GrowthMatrix for other people, you are the operator: set the
`COMPANY_*` variables and review the generated terms, privacy policy and DPA
for your jurisdiction. They are a starting point, not legal advice.

## Project layout

```
prisma/schema.prisma          # data model (org, users, framework, members, scores, activity)
prisma/migrations/            # SQL migrations
src/lib/
  db.ts                       # Prisma client singleton
  auth.ts                     # sessions, password hashing, revocation
  ownership.ts                # tenancy guards for ids that arrive in request bodies
  validation.ts               # shared zod schemas
  rate-limit.ts               # per-IP / per-email throttling
  compute.ts                  # pure score math (avg, gap, readiness, radar data…)
  data.ts                     # server read helpers / view-models
  members.ts                  # member creation + score seeding
  framework-template.ts       # optional PM starter framework
src/middleware.ts             # CSRF origin check, API cache headers
src/app/(auth)/               # login, signup, verify email, password reset
src/app/(legal)/              # terms, privacy, DPA
src/app/app/                  # the authenticated screens
src/app/api/                  # REST endpoints (members, scores, framework, inbox, account…)
src/components/               # shared UI + per-screen client components
project/                      # the original static design prototype (reference only)
```

## Multi-tenancy

Every domain row is scoped to an `Organization`. Signing up creates a new org,
a default review cycle, and an `OWNER` user. All API routes and server queries
filter by the session's `orgId`, and any id that arrives in a request body is
checked with the helpers in `src/lib/ownership.ts` before use. Contributions
must keep this invariant; see [CONTRIBUTING.md](CONTRIBUTING.md).

## Roadmap

Not built yet, and good places to contribute:

- Inviting more managers into a workspace
- Logins for team members themselves (self-assessment today is entered by the manager)
- CSV import, Slack and HR-system integrations (these currently show a "not
  available yet" toast instead of faking persistence)
- Billing

## Contributing

Issues and pull requests are welcome. Start with
[CONTRIBUTING.md](CONTRIBUTING.md), and please follow the
[Code of Conduct](CODE_OF_CONDUCT.md).

To report a security vulnerability, do **not** open a public issue. See
[SECURITY.md](SECURITY.md).

## License

[MIT](LICENSE)
