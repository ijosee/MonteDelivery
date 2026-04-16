# Implementation Plan: normalize-deployment-pipeline

## Overview

Create two GitHub Actions workflows (CI and Deploy) for monte-delivery, plus deployment documentation. The CI workflow validates code quality on every push/PR. The Deploy workflow orchestrates a quality gate, Prisma migrations, optional seeding, and Vercel deployment. A `packageManager` field is added to `package.json` so `pnpm/action-setup` can auto-detect the pnpm version.

## Tasks

- [x] 1. Add packageManager field to package.json
  - Add `"packageManager": "pnpm@<version>"` to `package.json` so `pnpm/action-setup@v4` can auto-detect the pnpm version in CI
  - Determine the installed pnpm version from the lockfile or local environment and pin it
  - _Requirements: 1.3, 8.4_

- [x] 2. Create CI workflow
  - [x] 2.1 Create `.github/workflows/ci.yml` with trigger configuration
    - Create the workflow file with `name: CI`
    - Configure `on.push.branches` for `main` and `develop`
    - Configure `on.pull_request.branches` for `main` and `develop`
    - Add concurrency group `ci-${{ github.ref }}` with `cancel-in-progress: true`
    - _Requirements: 1.1, 1.2, 1.5_
  - [x] 2.2 Add the `quality` job with setup steps
    - Define the `quality` job running on `ubuntu-latest`
    - Add `actions/checkout@v4` step
    - Add `pnpm/action-setup@v4` step (reads version from `packageManager` field)
    - Add `actions/setup-node@v4` with `node-version: 20` and `cache: pnpm`
    - Add `pnpm install --frozen-lockfile` step
    - _Requirements: 1.3, 1.4, 8.1, 8.3, 8.4_
  - [x] 2.3 Add lint, type-check, and test steps to the `quality` job
    - Add lint step: `pnpm run lint`
    - Add type-check step: `npx tsc --noEmit`
    - Add unit test step: `pnpm run test`
    - _Requirements: 1.6, 1.7, 1.8_

- [x] 3. Checkpoint - Verify CI workflow
  - Ensure the CI workflow YAML is valid and all steps match the design
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Create Deploy workflow
  - [x] 4.1 Create `.github/workflows/deploy.yml` with trigger and input configuration
    - Create the workflow file with `name: Deploy`
    - Configure `on.push.branches` for `main`
    - Configure `on.workflow_dispatch.inputs` with `environment` (choice: `staging`/`production`, default `production`) and `run_seed` (boolean, default `false`)
    - Add concurrency group `deploy-${{ github.ref }}` with `cancel-in-progress: false`
    - _Requirements: 2.1, 2.2, 2.3, 7.1_
  - [x] 4.2 Add the `quality-gate` job
    - Define the `quality-gate` job running on `ubuntu-latest`
    - Add checkout, pnpm setup, Node setup (with cache), and install steps (same pattern as CI)
    - Add lint step: `pnpm run lint`
    - Add type-check step: `npx tsc --noEmit`
    - Add unit test step: `pnpm run test`
    - Add build step: `pnpm run build` with environment variables from GitHub secrets (`DATABASE_URL`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, `SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT`)
    - _Requirements: 2.4, 2.5, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 6.1, 8.2_
  - [x] 4.3 Add the `migrate` job
    - Define the `migrate` job with `needs: quality-gate`
    - Set `environment` to `${{ github.event.inputs.environment || 'production' }}`
    - Add checkout, pnpm setup, Node setup (with cache), and install steps
    - Add migration step: `npx prisma migrate deploy` with `DATABASE_URL` from environment secrets
    - _Requirements: 4.1, 4.2, 4.3, 4.5, 6.2_
  - [x] 4.4 Add the `seed` job (conditional)
    - Define the `seed` job with `needs: migrate`
    - Add condition: `github.event_name == 'workflow_dispatch' && github.event.inputs.run_seed == 'true'`
    - Set `environment` to `${{ github.event.inputs.environment || 'production' }}`
    - Add checkout, pnpm setup, Node setup (with cache), and install steps
    - Add Prisma generate step: `npx prisma generate` with `DATABASE_URL`
    - Add seed step: `pnpm prisma:seed` with `DATABASE_URL` from environment secrets
    - _Requirements: 7.1, 7.2, 7.3, 7.4_
  - [x] 4.5 Add the `deploy` job
    - Define the `deploy` job with `needs: [migrate, seed]` and `if: always() && needs.migrate.result == 'success' && (needs.seed.result == 'success' || needs.seed.result == 'skipped')`
    - Set `environment` to `${{ github.event.inputs.environment || 'production' }}`
    - Add checkout, pnpm setup, Node setup (with cache), and install steps
    - Add Vercel CLI install step: `pnpm add -g vercel`
    - Add Vercel pull step: `vercel pull --yes --environment=${{ github.event.inputs.environment || 'production' }} --token=${{ secrets.VERCEL_TOKEN }}` with `VERCEL_ORG_ID` and `VERCEL_PROJECT_ID` env vars
    - Add Vercel build step: conditionally use `--prod` flag for production environment
    - Add Vercel deploy step: `vercel deploy --prebuilt` with conditional `--prod` flag
    - Add deployment summary step writing URL, environment, and actor to `$GITHUB_STEP_SUMMARY`
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 6.3_

- [x] 5. Checkpoint - Verify Deploy workflow
  - Ensure the deploy workflow YAML is valid and all jobs/steps match the design
  - Verify job dependency chain: quality-gate → migrate → seed (conditional) → deploy
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Create DEPLOYMENT.md documentation
  - Create `DEPLOYMENT.md` at the repository root
  - Document all required repository-level GitHub secrets (VERCEL_TOKEN, VERCEL_ORG_ID, VERCEL_PROJECT_ID, NEXTAUTH_URL, NEXTAUTH_SECRET, SENTRY_DSN, NEXT_PUBLIC_SENTRY_DSN, SENTRY_AUTH_TOKEN, SENTRY_ORG, SENTRY_PROJECT)
  - Document environment-level secrets (DATABASE_URL for `staging` and `production`)
  - Document how to configure GitHub Environments (`staging`, `production`)
  - Document how to trigger manual deployments via workflow dispatch
  - Document how to run the seed script via dispatch with `run_seed: true`
  - Document the CI workflow triggers and behavior
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [x] 7. Final checkpoint - Ensure all files are correct
  - Verify `package.json` has the `packageManager` field
  - Verify `.github/workflows/ci.yml` exists and is valid
  - Verify `.github/workflows/deploy.yml` exists and is valid
  - Verify `DEPLOYMENT.md` exists and covers all secrets and procedures
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- No property-based tests apply to this feature — it is entirely Infrastructure as Code (YAML workflows and documentation)
- Each task references specific requirement acceptance criteria for traceability
- Checkpoints ensure incremental validation of each workflow before proceeding
- The `packageManager` field in `package.json` is a prerequisite for `pnpm/action-setup@v4` auto-detection
