# Design Document: normalize-deployment-pipeline

## Overview

This design defines two GitHub Actions workflows for monte-delivery that replicate the proven CI/CD pattern from gitan-app, adapted for monte-delivery's tech stack (pnpm, Prisma ORM, Auth.js v5, Sentry, Vercel).

**Two workflow files will be created:**

1. **`.github/workflows/ci.yml`** — Runs on every push/PR to `main` or `develop`. Executes lint, type-check, and unit tests (including property-based tests via fast-check) in parallel.
2. **`.github/workflows/deploy.yml`** — Runs on push to `main` or manual dispatch. Executes a quality gate, then Prisma database migrations, then Vercel deployment in sequence.

**Key technology adaptations from gitan-app:**

| Concern | gitan-app | monte-delivery |
|---|---|---|
| Package manager | npm | pnpm (with `pnpm/action-setup`) |
| Dependency install | `npm ci` | `pnpm install --frozen-lockfile` |
| DB migrations | `supabase db push` | `npx prisma migrate deploy` |
| Caching | npm cache | pnpm store cache via `actions/setup-node` |
| Seed script | N/A | `pnpm prisma:seed` (optional, manual dispatch) |

## Architecture

The CI/CD architecture consists of two independent GitHub Actions workflows with clear job dependencies:

```mermaid
graph TD
    subgraph "ci.yml — PR & Push"
        A[Push / PR to main|develop] --> B[Setup: pnpm + Node 20 + cache]
        B --> C[pnpm install --frozen-lockfile]
        C --> D[Lint]
        C --> E[Type-check]
        C --> F[Unit tests + PBT]
        D & E & F --> G[CI Complete]
    end

    subgraph "deploy.yml — Deploy to Production"
        H[Push to main / Manual dispatch] --> I[Quality Gate Job]
        I -->|pass| J[Migration Job]
        I -->|fail| X1[Stop]
        J -->|pass| K{Seed enabled?}
        J -->|fail| X2[Stop]
        K -->|yes| L[Seed Job]
        K -->|no| M[Deploy Job]
        L -->|pass| M
        L -->|fail| X3[Stop]
        M --> N[Vercel Deploy Complete]
    end
```

### Concurrency Strategy

- **ci.yml**: Uses `concurrency` with `cancel-in-progress: true` — newer pushes to the same branch cancel stale CI runs (Requirement 1.5).
- **deploy.yml**: Uses `concurrency` with `cancel-in-progress: false` — deployments queue rather than cancel, preventing partial deploys (Requirement 2.3).

### Environment Strategy

The deploy workflow uses GitHub Environments (`staging` and `production`) to scope secrets per deployment target. The environment is determined by:
- **Push to main** → `production`
- **Manual dispatch** → user-selected (`staging` or `production`)

## Components and Interfaces

### Component 1: CI Workflow (`.github/workflows/ci.yml`)

**Trigger:** `push` to `main`/`develop`, `pull_request` targeting `main`/`develop`

**Single job: `quality`**

The CI workflow uses a single job with sequential steps rather than parallel jobs. This avoids duplicating the setup+install phase across multiple jobs (which would each take ~30s for pnpm install even with cache). Since lint, type-check, and test are all fast operations, running them sequentially in one job is more efficient.

| Step | Command | Purpose |
|---|---|---|
| Checkout | `actions/checkout@v4` | Clone repository |
| Setup pnpm | `pnpm/action-setup@v4` | Install pnpm (version from `packageManager` field) |
| Setup Node | `actions/setup-node@v4` with `cache: pnpm` | Install Node 20 + restore pnpm cache |
| Install deps | `pnpm install --frozen-lockfile` | Deterministic dependency install |
| Lint | `pnpm run lint` | ESLint checks |
| Type-check | `npx tsc --noEmit` | TypeScript compilation check |
| Unit tests | `pnpm run test` | Vitest unit + property-based tests |

**Concurrency group:** `ci-${{ github.ref }}` with `cancel-in-progress: true`

### Component 2: Deploy Workflow (`.github/workflows/deploy.yml`)

**Trigger:** `push` to `main`, `workflow_dispatch` with environment input

**Job chain:** `quality-gate` → `migrate` → `seed` (conditional) → `deploy`

#### Job 2a: `quality-gate`

Runs the same checks as CI plus a production build to catch build-time errors.

| Step | Command | Env vars needed |
|---|---|---|
| Checkout | `actions/checkout@v4` | — |
| Setup pnpm | `pnpm/action-setup@v4` | — |
| Setup Node | `actions/setup-node@v4` with `cache: pnpm` | — |
| Install deps | `pnpm install --frozen-lockfile` | — |
| Lint | `pnpm run lint` | — |
| Type-check | `npx tsc --noEmit` | — |
| Unit tests | `pnpm run test` | — |
| Build | `pnpm run build` | `DATABASE_URL`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, `SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT` |

The build step requires environment variables because:
- `next.config.ts` uses `withSentryConfig` which reads `SENTRY_ORG`, `SENTRY_PROJECT`, and `SENTRY_AUTH_TOKEN` at build time for source map upload.
- Prisma client generation needs `DATABASE_URL` (though it can be a dummy value for build-only).
- Auth.js reads `NEXTAUTH_SECRET` at build time for route generation.

#### Job 2b: `migrate`

**Depends on:** `quality-gate`
**Environment:** `${{ github.event.inputs.environment || 'production' }}`

| Step | Command | Env vars needed |
|---|---|---|
| Checkout | `actions/checkout@v4` | — |
| Setup pnpm | `pnpm/action-setup@v4` | — |
| Setup Node | `actions/setup-node@v4` with `cache: pnpm` | — |
| Install deps | `pnpm install --frozen-lockfile` | — |
| Run migrations | `npx prisma migrate deploy` | `DATABASE_URL` (from environment secrets) |

`prisma migrate deploy` applies all pending migrations from `prisma/migrations/` to the target database. It does not generate new migrations — it only applies existing ones. This is the correct command for CI/CD (as opposed to `prisma migrate dev` which is for local development).

#### Job 2c: `seed` (conditional)

**Depends on:** `migrate`
**Condition:** `github.event_name == 'workflow_dispatch' && github.event.inputs.run_seed == 'true'`
**Environment:** Same as migrate

| Step | Command | Env vars needed |
|---|---|---|
| Checkout | `actions/checkout@v4` | — |
| Setup pnpm | `pnpm/action-setup@v4` | — |
| Setup Node | `actions/setup-node@v4` with `cache: pnpm` | — |
| Install deps | `pnpm install --frozen-lockfile` | — |
| Generate Prisma client | `npx prisma generate` | `DATABASE_URL` |
| Run seed | `pnpm prisma:seed` | `DATABASE_URL` (from environment secrets) |

The seed job is only available via manual dispatch with the `run_seed` input set to `true`. This prevents accidental seeding on regular pushes to main.

#### Job 2d: `deploy`

**Depends on:** `migrate` (and `seed` if it ran)
**Environment:** Same as migrate

| Step | Command | Env vars needed |
|---|---|---|
| Checkout | `actions/checkout@v4` | — |
| Setup pnpm | `pnpm/action-setup@v4` | — |
| Setup Node | `actions/setup-node@v4` with `cache: pnpm` | — |
| Install Vercel CLI | `pnpm add -g vercel` | — |
| Pull Vercel env | `vercel pull --yes --environment=$ENV --token=$TOKEN` | `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` |
| Build | `vercel build --prod` (or without `--prod` for staging) | `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` |
| Deploy | `vercel deploy --prebuilt --prod` (or without `--prod`) | `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` |
| Summary | Write deployment URL to `$GITHUB_STEP_SUMMARY` | — |

The `--prod` flag is applied only when the target environment is `production`. For staging, the commands run without `--prod`, which deploys to a preview URL.

**Concurrency group:** `deploy-${{ github.ref }}` with `cancel-in-progress: false`

### Component 3: Deployment Documentation

A `DEPLOYMENT.md` file at the repository root documenting:
- All required GitHub secrets (repository-level and environment-level)
- How to configure GitHub Environments (`staging`, `production`)
- How to trigger manual deployments
- How to run the seed script via dispatch

## Data Models

This feature does not introduce new application data models. The relevant data structures are:

### GitHub Secrets (Repository-level)

| Secret | Used by | Purpose |
|---|---|---|
| `VERCEL_TOKEN` | Deploy job | Authenticate Vercel CLI |
| `VERCEL_ORG_ID` | Deploy job | Identify Vercel organization |
| `VERCEL_PROJECT_ID` | Deploy job | Identify Vercel project |
| `NEXTAUTH_URL` | Quality gate (build) | Auth.js base URL |
| `NEXTAUTH_SECRET` | Quality gate (build) | Auth.js session encryption |
| `SENTRY_DSN` | Quality gate (build) | Sentry error reporting DSN |
| `NEXT_PUBLIC_SENTRY_DSN` | Quality gate (build) | Sentry client-side DSN |
| `SENTRY_AUTH_TOKEN` | Quality gate (build) | Sentry source map upload auth |
| `SENTRY_ORG` | Quality gate (build) | Sentry organization slug |
| `SENTRY_PROJECT` | Quality gate (build) | Sentry project slug |

### GitHub Secrets (Environment-level: `staging` / `production`)

| Secret | Used by | Purpose |
|---|---|---|
| `DATABASE_URL` | Quality gate (build), Migration job, Seed job | Supabase PostgreSQL connection string |

`DATABASE_URL` is environment-scoped so that staging and production point to different databases.

### Workflow Dispatch Inputs

| Input | Type | Default | Options | Purpose |
|---|---|---|---|---|
| `environment` | `choice` | `production` | `staging`, `production` | Target deployment environment |
| `run_seed` | `boolean` | `false` | — | Whether to run seed script after migrations |

## Error Handling

### Job Failure Propagation

GitHub Actions `needs` keyword ensures strict sequential execution:
- If `quality-gate` fails → `migrate`, `seed`, and `deploy` are skipped automatically
- If `migrate` fails → `seed` and `deploy` are skipped automatically
- If `seed` fails → `deploy` is skipped automatically

No custom error handling logic is needed — GitHub Actions' built-in job dependency system handles this.

### Specific Failure Scenarios

| Scenario | Behavior | Recovery |
|---|---|---|
| Lint failure | CI/deploy stops at lint step | Fix lint errors and push again |
| Type-check failure | CI/deploy stops at tsc step | Fix type errors and push again |
| Test failure | CI/deploy stops at test step | Fix failing tests and push again |
| Build failure | Deploy stops at build step | Check env vars and build errors |
| Migration failure | Deploy stops, no Vercel deploy | Check DATABASE_URL, fix migration SQL, push again |
| Seed failure | Deploy stops, no Vercel deploy | Check seed script, fix data issues |
| Vercel CLI failure | Deploy step fails | Check VERCEL_TOKEN, ORG_ID, PROJECT_ID |
| Concurrent deploy | Queued (not cancelled) | Waits for in-progress deploy to finish |

### Secret Validation

The workflows rely on GitHub Actions' built-in behavior: if a required secret is not set, the step using it will fail with a clear error message. No pre-validation step is needed since GitHub Actions surfaces missing secrets in the step logs.

## Testing Strategy

### Why Property-Based Testing Does Not Apply

This feature creates GitHub Actions YAML workflow files and documentation. There are no pure functions, parsers, serializers, algorithms, or business logic to test. The acceptance criteria describe:
- Workflow triggers and event configuration (infrastructure)
- Job sequencing and dependency chains (infrastructure)
- CLI command execution (infrastructure)
- Secret configuration (infrastructure)
- Caching setup (infrastructure)

These are all Infrastructure as Code concerns. PBT requires functions with meaningful input variation — workflow YAML has none. The correct testing approach is manual validation and integration testing.

### Testing Approach

**Manual Validation (Primary):**
1. Push a PR to `develop` → verify CI workflow triggers and all steps pass
2. Merge to `main` → verify deploy workflow triggers with correct job sequence
3. Run manual dispatch with `staging` environment → verify environment selection works
4. Run manual dispatch with `run_seed: true` → verify seed job executes
5. Verify Vercel deployment URL appears in GitHub Actions summary

**YAML Linting:**
- Validate workflow YAML syntax using `actionlint` or GitHub's built-in workflow validation
- Verify all `actions/*` action versions are pinned to specific major versions (e.g., `@v4`)

**Integration Verification Checklist:**
- [ ] CI workflow cancels in-progress runs on same branch
- [ ] Deploy workflow queues (does not cancel) concurrent runs
- [ ] pnpm cache is restored on subsequent runs (check "Post Setup Node" step logs)
- [ ] Migration job uses correct GitHub Environment secrets
- [ ] Vercel deploy produces a valid deployment URL
- [ ] Seed job only runs when manually dispatched with `run_seed: true`
- [ ] All required secrets are documented in DEPLOYMENT.md
