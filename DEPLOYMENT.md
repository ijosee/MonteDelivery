# Deployment Guide

This document covers the CI/CD pipeline configuration for monte-delivery. The pipeline uses two GitHub Actions workflows — one for continuous integration and one for deployment to Vercel.

## Table of Contents

- [Prerequisites](#prerequisites)
- [GitHub Secrets](#github-secrets)
- [GitHub Environments](#github-environments)
- [CI Workflow](#ci-workflow)
- [Deploy Workflow](#deploy-workflow)
- [Manual Deployments](#manual-deployments)
- [Running the Seed Script](#running-the-seed-script)

## Prerequisites

- A GitHub repository with Actions enabled
- A Vercel account with a linked project
- A Supabase PostgreSQL database (one per environment)
- Node.js 20 and pnpm (managed automatically in CI via `packageManager` field in `package.json`)

## GitHub Secrets

The pipeline requires secrets at two levels: **repository-level** (shared across all jobs) and **environment-level** (scoped to a specific deployment target).

### Repository-Level Secrets

Configure these under **Settings → Secrets and variables → Actions → Repository secrets**:

| Secret | Used By | Description |
|---|---|---|
| `VERCEL_TOKEN` | Deploy job | Personal access token for the Vercel CLI. Generate one at [vercel.com/account/tokens](https://vercel.com/account/tokens). |
| `VERCEL_ORG_ID` | Deploy job | Your Vercel team/org ID. Found in your Vercel project settings or in `.vercel/project.json` after running `vercel link`. |
| `VERCEL_PROJECT_ID` | Deploy job | Your Vercel project ID. Found in the same location as `VERCEL_ORG_ID`. |
| `NEXTAUTH_URL` | Quality gate (build) | The canonical URL of the application (e.g., `https://monte-delivery.vercel.app`). Used by Auth.js at build time. |
| `NEXTAUTH_SECRET` | Quality gate (build) | A random string used by Auth.js to encrypt session tokens. Generate one with `openssl rand -base64 32`. |
| `SENTRY_DSN` | Quality gate (build) | Sentry Data Source Name for server-side error reporting. Found in your Sentry project settings under **Client Keys (DSN)**. |
| `NEXT_PUBLIC_SENTRY_DSN` | Quality gate (build) | Sentry DSN exposed to the browser. Typically the same value as `SENTRY_DSN`. |
| `SENTRY_AUTH_TOKEN` | Quality gate (build) | Sentry authentication token for source map uploads. Create one at [sentry.io/settings/auth-tokens](https://sentry.io/settings/auth-tokens/) with `project:releases` and `org:read` scopes. |
| `SENTRY_ORG` | Quality gate (build) | Your Sentry organization slug (visible in the URL: `sentry.io/organizations/<slug>/`). |
| `SENTRY_PROJECT` | Quality gate (build) | Your Sentry project slug (visible in the project settings URL). |

### Environment-Level Secrets

Configure these under **Settings → Environments → (select environment) → Environment secrets**:

| Secret | Environments | Used By | Description |
|---|---|---|---|
| `DATABASE_URL` | `staging`, `production` | Quality gate (build), Migration job, Seed job | Supabase PostgreSQL connection string. Each environment must point to its own database. |

The `DATABASE_URL` is environment-scoped so that staging and production deployments connect to separate databases.

## GitHub Environments

The deploy workflow uses [GitHub Environments](https://docs.github.com/en/actions/deployment/targeting-different-environments/using-environments-for-deployment) to scope secrets and (optionally) add protection rules per deployment target.

### Setting Up Environments

1. Go to **Settings → Environments** in your GitHub repository.
2. Create two environments: **`staging`** and **`production`**.
3. For each environment, add the `DATABASE_URL` secret with the connection string for that environment's database.

### Optional Protection Rules

You can add protection rules to either environment:

- **Required reviewers** — Require one or more approvals before a deployment proceeds. Useful for `production`.
- **Wait timer** — Add a delay before the deployment starts.
- **Deployment branches** — Restrict which branches can deploy to the environment (e.g., only `main` can deploy to `production`).

## CI Workflow

**File:** `.github/workflows/ci.yml`

The CI workflow validates code quality on every push and pull request.

### Triggers

| Event | Branches |
|---|---|
| `push` | `main`, `develop` |
| `pull_request` | `main`, `develop` |

### What It Runs

The workflow runs a single `quality` job with these steps in sequence:

1. **Checkout** — Clones the repository
2. **Setup pnpm** — Installs pnpm (version auto-detected from `packageManager` in `package.json`)
3. **Setup Node** — Installs Node.js 20 with pnpm dependency caching
4. **Install dependencies** — `pnpm install --frozen-lockfile`
5. **Lint** — `pnpm run lint`
6. **Type-check** — `npx tsc --noEmit`
7. **Unit tests** — `pnpm run test` (includes property-based tests via fast-check)

### Concurrency

Uses the concurrency group `ci-<branch>` with `cancel-in-progress: true`. If a new push arrives while a CI run is in progress on the same branch, the older run is cancelled automatically.

## Deploy Workflow

**File:** `.github/workflows/deploy.yml`

The deploy workflow handles the full deployment pipeline: quality checks, database migrations, optional seeding, and Vercel deployment.

### Triggers

| Event | Condition |
|---|---|
| `push` | To the `main` branch |
| `workflow_dispatch` | Manual trigger with environment and seed options |

### Job Chain

The workflow runs four jobs in sequence. Each job depends on the previous one succeeding:

```
quality-gate → migrate → seed (conditional) → deploy
```

| Job | Depends On | Description |
|---|---|---|
| `quality-gate` | — | Runs lint, type-check, unit tests, and a production build |
| `migrate` | `quality-gate` | Applies pending Prisma migrations via `npx prisma migrate deploy` |
| `seed` | `migrate` | Runs `pnpm prisma:seed` (only on manual dispatch with `run_seed: true`) |
| `deploy` | `migrate`, `seed` | Builds and deploys to Vercel using the CLI |

If any job fails, all downstream jobs are skipped. The `deploy` job runs if `migrate` succeeded and `seed` either succeeded or was skipped.

### Concurrency

Uses the concurrency group `deploy-<branch>` with `cancel-in-progress: false`. Concurrent deployments are **queued**, not cancelled, to prevent partial deploys.

### Environment Selection

- **Push to `main`** → deploys to `production` by default
- **Manual dispatch** → deploys to the selected environment (`staging` or `production`)

The Vercel CLI uses the `--prod` flag only for production deployments. Staging deployments create a preview URL.

## Manual Deployments

You can trigger a deployment manually without pushing code:

1. Go to **Actions → Deploy** in your GitHub repository.
2. Click **Run workflow**.
3. Select the target branch (typically `main`).
4. Choose the **environment**: `staging` or `production`.
5. Optionally enable **Run seed script after migrations** (see below).
6. Click **Run workflow**.

The workflow will run the full pipeline: quality gate → migrations → (optional seed) → Vercel deploy.

### Deployment Summary

After a successful deployment, the workflow writes a summary to the GitHub Actions run page with:

- **Deployment URL** — The Vercel URL where the app was deployed
- **Environment** — The target environment (`staging` or `production`)
- **Actor** — The GitHub user who triggered the deployment

## Running the Seed Script

The seed script (`prisma/seed.ts`) populates the database with initial data. It is **only available via manual dispatch** to prevent accidental seeding on regular pushes.

### How to Run

1. Go to **Actions → Deploy** in your GitHub repository.
2. Click **Run workflow**.
3. Select the target branch.
4. Choose the target **environment**.
5. Set **Run seed script after migrations** to `true`.
6. Click **Run workflow**.

The seed job runs after migrations complete successfully. It executes:

```bash
npx prisma generate    # Generate the Prisma client
pnpm prisma:seed       # Run the seed script
```

Both commands receive the `DATABASE_URL` from the selected environment's secrets.

If the seed script fails, the deployment is halted — the Vercel deploy step will not run.
