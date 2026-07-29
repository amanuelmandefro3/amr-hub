# AMR Hub deployment runbook

AMR Hub runs as a Next.js Node.js application backed by PostgreSQL 16 or newer.
Use a managed PostgreSQL provider with connection pooling for production.

## Required environment

Configure these values in the hosting platform for production and preview
environments:

```bash
DATABASE_URL="postgresql://USER:PASSWORD@POOLED_HOST:5432/amr_hub?sslmode=require"
DIRECT_URL="postgresql://USER:PASSWORD@DIRECT_HOST:5432/amr_hub?sslmode=require"
NEXT_PUBLIC_APP_URL="https://your-production-domain.example"
BETTER_AUTH_SECRET="GENERATED_SECRET"
AUTH_BOOTSTRAP_TOKEN="GENERATED_ONE_TIME_OWNER_TOKEN"
```

- `DATABASE_URL` is the pooled connection used by application requests.
- `DIRECT_URL` bypasses the pooler for migrations and administrative commands.
- `BETTER_AUTH_SECRET` signs and protects authentication cookies and must contain
  at least 32 unpredictable characters.
- `AUTH_BOOTSTRAP_TOKEN` authorizes the one-time owner account setup. Keep it
  private even after setup closes.
- Never commit either production database URL.

Generate independent authentication values:

```bash
openssl rand -base64 32
openssl rand -base64 32
```

Prisma documents the pooled and direct connection split in its
[database connection guide](https://www.prisma.io/docs/postgres/database/connecting-to-your-database).

## Local PostgreSQL

```bash
cp .env.example .env
npm install
npm run db:setup
npm run dev
```

The database listens on port `55433` to avoid common local PostgreSQL ports.
Use `npm run db:down` to stop the service without deleting its named volume.

## First production release

1. Provision managed PostgreSQL and record its pooled and direct URLs.
2. Add all five required environment variables to the hosting platform.
3. Apply the committed schema with the direct connection:

```bash
npm ci
npm run db:migrate
```

4. Deploy the application:

```bash
npx vercel deploy --prod
```

5. Confirm `GET /api/health` returns HTTP `200` with `"status": "ok"`.
6. Open `/setup`, create the owner with `AUTH_BOOTSTRAP_TOKEN`, and store the
   chosen password in a password manager.
7. Confirm `/setup` now redirects to sign-in and unauthenticated workspace APIs
   return HTTP `401`.
8. Sign in and confirm the eight demo issues, three cycles, and two system saved
   views were initialized.

`prisma migrate deploy` applies pending migrations without resetting existing
data. Run it before promoting application code that depends on a new schema.

## Release verification

Run these checks before every production release:

```bash
npm ci
npm run lint
npm run test:run
npm run build
npm audit --omit=dev
```

After deployment, verify:

- `/api/health` reports a reachable database.
- Unauthenticated `/`, `/issues`, and `/cycles` redirect to `/login`.
- Authenticated `/`, `/issues`, and `/cycles` return HTTP `200`.
- Unauthenticated workspace APIs return HTTP `401`.
- Creating and editing an issue persists after a page reload.
- Password changes revoke other sessions and sign-out invalidates API access.
- TOTP enrollment requires a valid password, a verified authenticator code, and
  produces one-time backup codes that should be stored outside the workspace.
- Password recovery codes are displayed once, stored only as hashes, and revoke
  every account session and unused recovery code after a successful reset.
- An owner can create and revoke a member invitation, and the revoked link is
  rejected without creating an account.
- Hosting logs contain no Prisma connection or migration errors.

## Backups and recovery

Enable automated provider backups with at least seven days of retention. Before
a destructive or high-risk migration, also take an explicit backup:

```bash
pg_dump --format=custom --file=amr-hub.backup "$DIRECT_URL"
```

Test restores in a separate database:

```bash
pg_restore --clean --if-exists --no-owner --dbname="$RESTORE_URL" amr-hub.backup
```

Never test a restore against the production database.

## Rollback

1. Roll back the application to the last known-good hosting deployment.
2. Prefer a forward-fix migration for additive schema problems.
3. Restore a database backup only when data corruption or destructive migration
   makes a forward fix impossible.
4. Re-run `/api/health` and the release verification checks.
