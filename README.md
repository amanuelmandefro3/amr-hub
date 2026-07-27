# AMR Hub

AMR Hub is a focused issue-triage and delivery workspace for software teams.
The portfolio demo is designed to be immediately usable: it ships with realistic
sample work and persists every issue, comment, and activity event through a
server API backed by PostgreSQL.

## Product experience

- Delivery overview with active work, completion rate, urgency, throughput, and
  cycle health
- Searchable and filterable issue workspace
- Inline workflow status changes
- Validated issue creation with type, priority, and ownership
- Issue discussions and append-only activity history
- Due dates, workspace labels, label filtering, and planning activity
- Server-backed saved views for reusable search, status, priority, ownership,
  label, and sort combinations
- Cycle planning with capacity, Fibonacci effort estimates, scope progress, and
  at-risk work
- Responsive desktop and mobile navigation
- Keyboard shortcut: press `C` outside a form field to create an issue
- Durable server persistence across browsers and page reloads
- Database-aware readiness endpoint for deployment health checks
- Automated validation and planning tests with a migration-aware CI pipeline
- Branded Open Graph and social-sharing preview

## Run locally

Requires Node.js 20.19 or newer.

```bash
cp .env.example .env
npm install
npm run db:setup
npm run dev
```

The repository includes an isolated PostgreSQL 16 service for local
development. The first API request seeds the sample workspace only when the
database is empty.

Open the local URL printed by Next.js. Production checks:

```bash
npm run lint
npm run test:run
npm run build
npm audit --omit=dev
```

## Architecture

- Next.js 16 App Router, React 19, and TypeScript
- Tailwind/PostCSS build pipeline with a custom operational design system
- Lucide icons
- Zod request validation
- Prisma and PostgreSQL with separate pooled runtime and direct migration
  connections
- Relational workspace labels and indexed issue planning metadata
- REST endpoints for issue loading, creation, editing, discussion, labels, and
  saved views
- Server-owned issue numbering and audit event generation
- Vitest coverage for API schemas and cycle calculations
- GitHub Actions checks for dependency security, migrations, lint, tests, and
  production builds
- `/api/health` readiness checks for database connectivity

## Deployment

AMR Hub is configured for Vercel or another Node.js host connected to managed
PostgreSQL. Production setup, migrations, verification, backups, and rollback
steps are documented in [the deployment runbook](docs/DEPLOYMENT.md).

## Product roadmap

The next production milestones build on the durable server data:

1. Authentication, organizations, and membership roles
2. Attachments, custom fields, and richer planning metadata
3. Backlog triage, cycle automation, workload forecasting, and dependencies
4. Notifications plus GitHub, Slack, and error-monitoring integrations
5. Browser-level accessibility tests, observability, rate limiting, and
   automated incident response

This scope follows the strongest patterns in established trackers: issues need
clear ownership, priority, workflow state, and optional planning properties
before adding heavier automation. See [Linear's issue model](https://linear.app/docs/conceptual-model),
[Linear triage](https://linear.app/docs/triage), and
[Jira bug tracking](https://www.atlassian.com/software/jira/features/bug-tracking).
