## What and why

<!-- What does this change, and what problem does it solve? Link the issue: "Closes #123". -->

## How I tested it

<!-- Commands run, screens checked, screenshots for UI changes. -->

## Checklist

- [ ] `npm run typecheck && npm run lint && npm test` passes
- [ ] New or changed logic has tests
- [ ] Server code filters by `orgId`, and ids from request bodies go through `src/lib/ownership.ts`
- [ ] Schema changes include a Prisma migration
- [ ] No secrets or real personal data committed
