# Requirements Document

## Introduction

monte-delivery currently lacks any automated deployment pipeline. The goal is to normalize its CI/CD setup to match the proven pattern used by gitan-app: GitHub Actions for continuous integration (lint, type-check, tests), automated database migrations in the pipeline, and Vercel deployment via CLI. monte-delivery retains its existing technology choices (Prisma ORM, pnpm, Auth.js) — only the deployment and CI/CD infrastructure is being aligned.

## Glossary

- **CI_Pipeline**: The GitHub Actions continuous integration workflow that runs on pushes and pull requests to validate code quality (lint, type-check, unit tests, property-based tests)
- **Deploy_Pipeline**: The GitHub Actions deployment workflow that runs on pushes to main, orchestrating quality checks, database migrations, and Vercel deployment in sequence
- **Vercel_CLI**: The Vercel command-line interface used to pull environment configuration, build the project, and deploy it from within GitHub Actions
- **Prisma_CLI**: The Prisma command-line interface used to run `prisma migrate deploy` to apply pending database migrations against the production Supabase PostgreSQL database
- **Quality_Gate**: The set of automated checks (lint, type-check, unit tests, property-based tests, build) that must pass before deployment proceeds
- **Migration_Job**: The GitHub Actions job that applies pending Prisma database migrations to the target environment's Supabase PostgreSQL database
- **Deploy_Job**: The GitHub Actions job that builds and deploys the Next.js application to Vercel
- **Seed_Script**: The existing `prisma/seed.ts` script that populates the database with initial data, executable via `pnpm prisma:seed`

## Requirements

### Requirement 1: CI Workflow for Pull Requests and Pushes

**User Story:** As a developer, I want automated quality checks on every push and pull request, so that code issues are caught before merging.

#### Acceptance Criteria

1. WHEN a push is made to the `main` or `develop` branch, THE CI_Pipeline SHALL run lint, type-check, unit test, and property-based test jobs
2. WHEN a pull request targets the `main` or `develop` branch, THE CI_Pipeline SHALL run lint, type-check, unit test, and property-based test jobs
3. THE CI_Pipeline SHALL use pnpm as the package manager for dependency installation with `pnpm install --frozen-lockfile`
4. THE CI_Pipeline SHALL use Node.js version 20
5. WHEN multiple CI runs are triggered for the same branch, THE CI_Pipeline SHALL cancel in-progress runs and keep only the latest
6. THE CI_Pipeline SHALL run the lint job by executing `pnpm run lint`
7. THE CI_Pipeline SHALL run the type-check job by executing `npx tsc --noEmit`
8. THE CI_Pipeline SHALL run the unit test job by executing `pnpm run test`

### Requirement 2: Deploy Workflow Triggered on Main

**User Story:** As a developer, I want automated deployment when code is pushed to main, so that production stays up to date without manual intervention.

#### Acceptance Criteria

1. WHEN a push is made to the `main` branch, THE Deploy_Pipeline SHALL trigger automatically
2. WHEN a manual workflow dispatch is requested, THE Deploy_Pipeline SHALL allow selecting between `staging` and `production` environments
3. THE Deploy_Pipeline SHALL prevent concurrent deployments to the same branch by using a concurrency group without cancelling in-progress runs
4. THE Deploy_Pipeline SHALL use pnpm as the package manager with `pnpm install --frozen-lockfile`
5. THE Deploy_Pipeline SHALL use Node.js version 20

### Requirement 3: Quality Gate in Deploy Workflow

**User Story:** As a developer, I want the deploy workflow to verify code quality before deploying, so that broken code never reaches production.

#### Acceptance Criteria

1. THE Quality_Gate SHALL run lint, type-check, unit tests, and a production build as part of the deploy workflow
2. THE Quality_Gate SHALL execute `pnpm run lint` for linting
3. THE Quality_Gate SHALL execute `npx tsc --noEmit` for type checking
4. THE Quality_Gate SHALL execute `pnpm run test` for unit tests
5. THE Quality_Gate SHALL execute `pnpm run build` for the production build, providing all required environment variables (DATABASE_URL, NEXTAUTH_URL, NEXTAUTH_SECRET, and Sentry variables) from GitHub secrets
6. IF the Quality_Gate fails on any check, THEN THE Deploy_Pipeline SHALL stop and not proceed to migration or deployment

### Requirement 4: Automated Database Migrations

**User Story:** As a developer, I want database migrations to run automatically during deployment, so that the database schema stays in sync with the application code.

#### Acceptance Criteria

1. THE Migration_Job SHALL run only after the Quality_Gate completes successfully
2. THE Migration_Job SHALL execute `npx prisma migrate deploy` to apply pending migrations to the target Supabase PostgreSQL database
3. THE Migration_Job SHALL receive the DATABASE_URL from GitHub environment secrets to connect to the correct database
4. IF the Migration_Job fails, THEN THE Deploy_Pipeline SHALL stop and not proceed to the Vercel deployment
5. THE Migration_Job SHALL use the GitHub Actions environment matching the deployment target (`staging` or `production`)

### Requirement 5: Vercel Deployment via CLI

**User Story:** As a developer, I want the application deployed to Vercel automatically after migrations succeed, so that the full deployment is hands-free.

#### Acceptance Criteria

1. THE Deploy_Job SHALL run only after both the Quality_Gate and Migration_Job complete successfully
2. THE Deploy_Job SHALL install the Vercel CLI globally using `pnpm add -g vercel`
3. THE Deploy_Job SHALL pull the Vercel environment configuration using `vercel pull` with the appropriate environment flag and VERCEL_TOKEN
4. THE Deploy_Job SHALL build the project using `vercel build` with the `--prod` flag for production deployments
5. THE Deploy_Job SHALL deploy the prebuilt output using `vercel deploy --prebuilt` with the `--prod` flag for production deployments
6. WHEN the deployment completes, THE Deploy_Job SHALL output a deployment summary including the deployment URL, environment name, and triggering actor
7. THE Deploy_Job SHALL use VERCEL_ORG_ID, VERCEL_PROJECT_ID, and VERCEL_TOKEN from GitHub secrets

### Requirement 6: GitHub Secrets Configuration Documentation

**User Story:** As a developer, I want clear documentation of all required GitHub secrets, so that I can configure the repository correctly for the pipeline to work.

#### Acceptance Criteria

1. THE Deploy_Pipeline SHALL require the following GitHub secrets for the quality gate: DATABASE_URL, NEXTAUTH_URL, NEXTAUTH_SECRET, SENTRY_DSN, NEXT_PUBLIC_SENTRY_DSN, SENTRY_AUTH_TOKEN, SENTRY_ORG, SENTRY_PROJECT
2. THE Deploy_Pipeline SHALL require the following GitHub secrets for database migrations: DATABASE_URL (from the GitHub environment)
3. THE Deploy_Pipeline SHALL require the following GitHub secrets for Vercel deployment: VERCEL_TOKEN, VERCEL_ORG_ID, VERCEL_PROJECT_ID
4. THE Deploy_Pipeline SHALL document all required secrets in a README section or deployment guide

### Requirement 7: Seed Script Execution Support

**User Story:** As a developer, I want the ability to run the seed script against the target database from the pipeline, so that I can populate initial data when needed.

#### Acceptance Criteria

1. THE Deploy_Pipeline SHALL support a manual workflow dispatch option to run the seed script after migrations
2. WHEN the seed option is enabled in a manual dispatch, THE Deploy_Pipeline SHALL execute `pnpm prisma:seed` after the Migration_Job completes successfully
3. THE Seed_Script execution SHALL receive the DATABASE_URL from GitHub environment secrets
4. IF the Seed_Script fails, THEN THE Deploy_Pipeline SHALL stop and not proceed to the Vercel deployment

### Requirement 8: pnpm Caching in GitHub Actions

**User Story:** As a developer, I want dependency installation to be fast in CI, so that pipeline runs complete quickly.

#### Acceptance Criteria

1. THE CI_Pipeline SHALL configure pnpm caching using the `actions/setup-node` action with `cache: pnpm`
2. THE Deploy_Pipeline SHALL configure pnpm caching using the `actions/setup-node` action with `cache: pnpm`
3. WHEN cached dependencies are available, THE CI_Pipeline SHALL reuse them to reduce installation time
4. THE CI_Pipeline SHALL install pnpm using `pnpm/action-setup` with the version matching the project's `packageManager` field or a pinned version
