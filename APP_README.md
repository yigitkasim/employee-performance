# GrowthMatrix

A manager's tool for evaluating and growing their team — rebuilt from the
Claude Design prototype (`project/`) as a real multi-tenant SaaS.

Managers define a **skill framework** (roles → levels → skill groups →
sub-skills, plus an expected-score matrix), add **team members**, and rate them
1–5 on every sub-skill. From those ratings the app derives radars, skill-gap
heatmaps, a growth simulator, promotion readiness, self-vs-manager deltas, 1:1
prep, a coaching log, and a quick-capture inbox.

## Stack

- **Next.js 15** (App Router, React 19, TypeScript) — frontend + API routes
- **PostgreSQL 16** via **Prisma 6**
- **Tailwind CSS 3** + **Chart.js 4** (radar charts)
- Custom email/password auth (bcrypt + signed JWT in an httpOnly cookie, `jose`)

## Multi-tenancy & auth

Every domain row is scoped to an `Organization`. Signing up creates a new org, a
default review cycle, and an `OWNER` user. All API routes and server queries
filter by the session's `orgId`, so tenants are fully isolated.

## Getting started

```bash
# 1. Postgres must be running and reachable via DATABASE_URL (.env)
#    Local dev cluster: pg_ctlcluster 16 main start
# 2. Install + set up the schema
npm install
npx prisma db push        # or: npx prisma migrate dev
npx prisma generate
# 3. Run
npm run dev               # http://localhost:3000
```

Then open the app, **create a workspace**, and either **Load the PM starter
framework** (one click on the Team page) or build your own in *Roles & skills*.
The database starts empty (clean slate) by design.

### Environment (`.env`)

```
DATABASE_URL="postgresql://gm_app:gm_dev_password@127.0.0.1:5432/growthmatrix?schema=public"
AUTH_SECRET="<random 32+ char secret>"   # change in production
```

## Project layout

```
prisma/schema.prisma          # data model (org, users, framework, members, scores, activity)
src/lib/
  db.ts                       # Prisma client singleton
  auth.ts                     # sessions, password hashing
  compute.ts                  # pure score math (avg, gap, readiness, radar data…)
  data.ts                     # server read helpers / view-models
  members.ts                  # member creation + score seeding
  framework-template.ts       # optional PM starter framework
src/app/(auth)/               # login / signup
src/app/(app)/                # the 12 authenticated screens
src/app/api/                  # REST endpoints (members, scores, framework, inbox, …)
src/components/               # shared UI + per-screen client components
project/                      # the original design prototype (reference only)
```

## The 12 screens

Team · Profile · Skills (rate) · Skill gaps · Growth simulator · Self vs
manager · Compare members · Promotion · 1:1 prep · History & log · Capture
inbox · Roles & skills framework.

## Notes

- Actions that would need a third-party integration (CSV import, Slack, HR
  share/export) surface a toast rather than faking persistence — matching the
  prototype's honesty about what's wired up.
- `⌘⇧L` opens quick capture from anywhere.
