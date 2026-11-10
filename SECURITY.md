# Security Policy

GrowthMatrix stores employee performance data, so security reports are taken
seriously and handled before other work.

## Supported versions

Only the latest commit on `main` receives security fixes.

## Reporting a vulnerability

**Do not open a public issue, discussion or pull request for a security
problem.**

Report it privately through GitHub: open the repository's **Security** tab and
click **Report a vulnerability**. This creates a private advisory visible only
to you and the maintainers.

Please include:

- What the issue is and where it lives (file, route, or screen)
- Steps to reproduce, or a proof of concept
- The impact you expect, for example cross-tenant data access, account
  takeover, or privilege escalation

## What to expect

- Acknowledgement within 5 business days
- An initial assessment and planned fix timeline within 10 business days
- Credit in the advisory once the fix is released, unless you prefer to stay
  anonymous

## Scope

In scope: this repository's code, including authentication, session handling,
tenant isolation, and the API routes under `src/app/api/`.

Out of scope: vulnerabilities in a specific third-party deployment of
GrowthMatrix (report those to whoever operates it), and issues in upstream
dependencies that are already publicly known.

Please test only against your own local or self-hosted instance, never against
someone else's deployment or data.
