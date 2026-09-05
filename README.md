# mom

This project was created with [Better-T-Stack](https://github.com/AmanVarshney01/create-better-t-stack), a modern TypeScript stack that combines React, TanStack Start, Self, and more.

## Neighborhood form

The public form opens with an introduction, then collects a name, structured address (road name, block / house number, RT, RW), and one or more composting methods in three steps. Back navigation preserves answers, and each step validates before continuing. Motion uses the lightweight `motion/react-m` components through `MotionProvider`, with `LazyMotion` loading only `domAnimation`; reduced-motion preferences are respected. It uses shared shadcn/ui controls, a shared Zod schema, and a typed TanStack Start POST server function. Responses are persisted in SQLite through Drizzle; retries reuse the submission ID to prevent duplicate rows. No authentication or public response listing is included.

Migration `0002_busy_purifiers.sql` adds separate address columns without changing existing addresses. New submissions also populate the original display-address column. Apply migrations before running or deploying this version. RT and RW remain text to preserve leading zeros.

Edit the three placeholder methods in `apps/web/src/features/submissions/schema.ts` (including the enum if changing IDs).

For local development, set `TURSO_DATABASE_URL=file:../../local.db` in `apps/web/.env`, then run `bun run --cwd packages/db db:migrate` and `bun run dev:web`. The relative database path resolves to the repository root from both the web and database packages; `TURSO_AUTH_TOKEN` can be omitted for a local file. For hosting, configure both the Turso database URL and authentication token, then apply the migrations before starting the app.

## Features

- **TypeScript** - For type safety and improved developer experience
- **TanStack Start** - SSR framework with TanStack Router
- **TailwindCSS** - Utility-first CSS for rapid UI development
- **Shared UI package** - shadcn/ui primitives live in `packages/ui`
- **Drizzle** - TypeScript-first ORM
- **SQLite/Turso** - Database engine
- **Oxlint** - Oxlint + Oxfmt (linting & formatting)
- **Turborepo** - Optimized monorepo build system

## Getting Started

First, install the dependencies:

```bash
bun install
```

## Database Setup

This project uses SQLite with Drizzle ORM.

1. Start the local SQLite database (optional):

```bash
bun run db:local
```

2. Update your `.env` file in the `apps/web` directory with the appropriate connection details if needed.

3. Apply the schema to your database:

```bash
bun run db:push
```

Then, run the development server:

```bash
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the fullstack application.

## UI Customization

React web apps in this stack share shadcn/ui primitives through `packages/ui`.

- Change design tokens and global styles in `packages/ui/src/styles/globals.css`
- Update shared primitives in `packages/ui/src/components/*`
- Adjust shadcn aliases or style config in `packages/ui/components.json` and `apps/web/components.json`

### Add more shared components

Run this from the project root to add more primitives to the shared UI package:

```bash
npx shadcn@latest add accordion dialog popover sheet table -c packages/ui
```

Import shared components like this:

```tsx
import { Button } from "@mom/ui/components/button";
```

### Add app-specific blocks

If you want to add app-specific blocks instead of shared primitives, run the shadcn CLI from `apps/web`.

## Deployment

### Admin view

Open `/admin` to view responses, newest first, with 50 responses per page. The read-only data table uses shared shadcn Table primitives and TanStack Table with controlled server-side pagination. Columns show the resident's name, address, composting methods, and submission time in WIB. It uses Indonesian labels and horizontal scrolling on small screens. There are no user accounts or auth service dependencies.

TanStack Query manages server state: `useQuery` loads admin pages; `useMutation` handles login, logout, and public form submission, using typed TanStack Start server functions. Admin query results are discarded when inactive and cleared on logout. Run `bun test tests/admin-security.test.ts` for password, concurrent rate-limit, migration, and pagination checks against an isolated temporary database.

Before first use:

1. Run `bun run db:migrate` against the intended database. Migration `0003_curved_the_liberteens.sql` adds the persistent login-attempt counter.
2. Run `bun run admin:setup` in an interactive terminal. Choose and confirm a password of at least 12 characters; input is hidden. The command saves `ADMIN_PASSWORD_HASH` and `ADMIN_SESSION_SECRET` to the ignored `apps/web/.env`, preserving other settings.
3. Restart the local app. For Vercel, configure both variables in the deployment environment and redeploy (the existing `env:preview` / `env:production` scripts can sync the file). Use a hosted database URL, not the local SQLite file, when syncing deployment variables.

The server verifies a salted scrypt hash and uses TanStack Start's encrypted session cookie for up to 30 days. Production cookies are Secure, HttpOnly, SameSite=Strict, and host-only. Every listing request checks the session before querying responses; admin HTML and data responses are marked private/no-store. Login and logout require a matching Origin header. Missing admin secrets disable admin access without disabling the public form.

The database enforces a shared budget of 20 login attempts per 15-minute window across all server instances. Because there is only one admin, this deliberately uses a global limit: other people's attempts can temporarily delay her login. There are no account/session tables; only the rate-limit counter is stored. Run `admin:setup` again and update/redeploy Vercel to change the password and invalidate all existing sessions. Logout removes the current browser's cookie; a copied cookie remains valid until expiry or credential rotation.

### Vercel Services

- Target: web + server
- Config: `vercel.json`
- Link the project first: bun run deploy:setup
- Local Vercel dev: bun run dev:vercel
- Sync preview env: bun run env:preview
- Sync production env: bun run env:production
- Dry-run check (no upload): bun run deploy:check
- Preview deploy: bun run deploy
- Production deploy: bun run deploy:prod
  Vercel Services share project environment variables, but deploys do not upload local `.env` files automatically. Link the project with `vercel link`, then run the env sync command before your first deploy (otherwise the deployment starts with no env vars), or pass one-off envs with `vercel deploy -e KEY=value`.
  Pass Vercel CLI flags to the env sync command directly, for example: `bun run env:production --scope your-team`.

For more details, see the guide on [Deploying to Vercel](https://www.better-t-stack.dev/docs/guides/vercel).

## Git Hooks and Formatting

- Run checks: `bun run check`

## Project Structure

```
mom/
├── apps/
│   └── web/         # Fullstack application (React + TanStack Start)
├── packages/
│   ├── ui/          # Shared shadcn/ui components and styles
│   └── db/          # Database schema & queries
```

## Available Scripts

- `bun run dev`: Start all applications in development mode
- `bun run build`: Build all applications
- `bun run dev:web`: Start only the web application
- `bun run check-types`: Check TypeScript types across all apps
- `bun run db:push`: Push schema changes to database
- `bun run db:generate`: Generate database client/types
- `bun run db:migrate`: Run database migrations
- `bun run db:studio`: Open database studio UI
- `bun run db:local`: Start the local SQLite database
- `bun run check`: Run Oxlint and Oxfmt
- `bun run deploy:setup`: Link this repo to a Vercel project (first-time setup)
- `bun run dev:vercel`: Run the Vercel Services dev environment locally
- `bun run env:preview`: Sync local env files to the Vercel preview environment
- `bun run env:production`: Sync local env files to the Vercel production environment
- `bun run deploy`: Create a Vercel preview deployment
- `bun run deploy:prod`: Deploy to Vercel production
- `bun run deploy:check`: Dry-run a deploy to preview framework detection and included files without uploading
