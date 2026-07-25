# AMR Hub

AMR Hub is a focused issue-triage and delivery workspace for software teams.
The portfolio demo is designed to be immediately usable: it ships with realistic
sample work, persists changes in the browser, and does not require an account or
database to explore.

## Product experience

- Delivery overview with active work, completion rate, urgency, throughput, and
  cycle health
- Searchable and filterable issue workspace
- Inline workflow status changes
- Validated issue creation with type, priority, and ownership
- Responsive desktop and mobile navigation
- Keyboard shortcut: press `C` outside a form field to create an issue
- Local persistence so a reviewer can create and update work
- Branded Open Graph and social-sharing preview

## Run locally

Requires Node.js 20.9 or newer.

```bash
npm install
npm run dev
```

Open the local URL printed by Next.js. Production checks:

```bash
npm run lint
npm run build
npm audit --omit=dev
```

## Architecture

- Next.js 16 App Router, React 19, and TypeScript
- Tailwind/PostCSS build pipeline with a custom operational design system
- Lucide icons
- Zod validation
- Prisma and MySQL integration boundary at `src/app/api/issue/route.ts`

The visible portfolio workspace currently stores demo changes in `localStorage`.
This is intentional: reviewers get a complete interaction loop without
provisioning infrastructure. The existing API route is retained as the starting
point for durable server persistence. Copy `.env.example` to `.env`, provide a
MySQL connection, and run the Prisma migrations before using that route.

## Product roadmap

The next production milestone should replace demo storage with authenticated
server data. The highest-value sequence is:

1. Authentication, organizations, membership roles, and database-backed CRUD
2. Issue detail pages with comments, activity history, attachments, labels, and
   due dates
3. Saved views, backlog triage, cycles, estimates, and capacity
4. Notifications plus GitHub, Slack, and error-monitoring integrations
5. Automated API/component tests, accessibility checks, observability, rate
   limiting, backups, and deployment runbooks

This scope follows the strongest patterns in established trackers: issues need
clear ownership, priority, workflow state, and optional planning properties
before adding heavier automation. See [Linear's issue model](https://linear.app/docs/conceptual-model),
[Linear triage](https://linear.app/docs/triage), and
[Jira bug tracking](https://www.atlassian.com/software/jira/features/bug-tracking).
