# Contributing to GrowthMatrix

Thanks for helping out. This guide covers how to get a dev environment running,
the rules every change must follow, and how to send a pull request.

## Ways to contribute

- **Report a bug:** open an issue with steps to reproduce, what you expected,
  and what happened.
- **Suggest a feature:** open an issue describing the problem first. For
  anything larger than a small fix, agree on the approach in the issue before
  writing code.
- **Send a pull request:** bug fixes, tests, docs and roadmap items from the
  [README](README.md#roadmap) are all welcome.

Security problems are the exception: report them privately as described in
[SECURITY.md](SECURITY.md).

## Development setup

You need Node.js 20+ and a PostgreSQL 16 database.

```bash
cp .env.example .env      # set DATABASE_URL, DIRECT_URL and AUTH_SECRET
npm install
npx prisma migrate dev
npm run dev
```

Without `RESEND_API_KEY`, verification and password-reset links are printed to
the server console, so you can complete signup locally without an email
provider.

## Before you open a pull request

Run these checks from the repo root. All of them must pass:

```bash
npm run typecheck && npm run lint && npm test
```

- Add or update unit tests for logic you change. Pure score math lives in
  `src/lib/compute.ts` and is tested in `src/lib/compute.test.ts`.
- If you change `prisma/schema.prisma`, include the generated migration
  (`npm run db:migrate -- --name short_description`). Do not edit migrations
  that are already on `main`.
- Keep pull requests focused: one fix or feature per PR.

## Rules for server code

GrowthMatrix is multi-tenant. A bug here leaks one company's performance data
to another, so these rules are not optional.

1. **Scope every query to the session's organization.** Get the session with
   `authed()` (API routes) or `getVerifiedSession()` (pages) and filter every
   read and write by `orgId`.
2. **Never trust ids in a request body.** An id in the URL or JSON payload can
   belong to another organization. Resolve it with the helpers in
   `src/lib/ownership.ts` (`ownedRoleId`, `ownedLevelId`, …) and treat `null`
   as "not found".
3. **Validate input with zod.** Reuse the schemas in `src/lib/validation.ts`
   and return `badRequest()` / `notFound()` from `src/lib/api-helpers.ts`.
4. **Do not weaken security defaults** (CSRF origin check in
   `src/middleware.ts`, rate limits in `src/lib/rate-limit.ts`, security
   headers in `next.config.js`) without discussing it in an issue first.
5. **Never commit secrets.** `.env` is git-ignored; document new variables in
   `.env.example` with a placeholder value.

## Commit messages and pull requests

- Write commit subjects in the imperative mood ("Add CSV export", not
  "Added CSV export").
- In the PR description, say what changed, why, and how you tested it. Link
  the issue it closes.
- Screenshots help for any UI change.

## License

By contributing, you agree that your contributions are licensed under the
project's [MIT License](LICENSE).
