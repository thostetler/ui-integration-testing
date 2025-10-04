# Repository Guidelines

## Project Structure & Module Organization
UI integration tests live in `tests/`, organized by surface (`ads`, `scix`) with shared fixtures in `tests/common.ts` and typed helpers under `tests/interfaces`. Authentication state and recorded sessions sit in `playwright/.auth`. Support code such as Gmail providers is under `provider/`, and data schemas live in `schemas/`. Performance artifacts land in `perf-results/` and `aggregated_averages.csv`; the `agg_timings.js` script reduces raw timing output.

## Build, Test, and Development Commands
Run `pnpm install` once; the repo enforces pnpm via the `preinstall` hook. Use `pnpm test` for the default Playwright project, `pnpm smoke` or `pnpm stress` for tagged subsets, and `pnpm auth` when iterating on authenticated flows. `pnpm test -- --ui` opens the Playwright runner; append `--headed` to observe the browser. Performance loops rely on `pnpm test:perf`, and `pnpm aggregate` converts timing CSVs into summary averages.

## Coding Style & Naming Conventions
Tests and utilities are TypeScript-first, using ES module imports (`import { test } from '@playwright/test'`). Stick to 2-space indentation and prefer descriptive identifiers over abbreviations. Path aliases (`@/`, `@ads/`, `@scix/`) resolve from `tsconfig.json`; favor them over relative climbs. ESLint with the Prettier bridge runs automatically, so format before committing (`pnpm exec eslint .` plus Prettier if your editor is misconfigured). Test specs end with `.spec.ts`; setup helpers use `.setup.ts`.

## Testing Guidelines
Playwright’s `@playwright/test` runner is the single source of truth. Tag scenarios with `@auth`, `@smoke`, `@stress`, or `@perf` so scripts stay filterable. Authenticated suites require `TEST_EMAIL`, `TEST_EMAIL_ALT`, and `TEST_PASSWORD`; Gmail-driven flows also need `GOOGLE_APPLICATION_CREDENTIALS` pointing at the downloaded credentials in `provider/`. Use the provided fixtures (for example `loggedInPage`) instead of recreating sign-in steps. Capture new baseline screenshots under the styles in `tests/screenshots.css` and stash generated traces under `playwright` when debugging locally.

## Commit & Pull Request Guidelines
Recent history favors concise, lower-case subjects (for example `get search page working add account pages`). Follow the imperative mood, keep ≤72 characters, and drop “wip” before asking for review. Each PR should describe the scenario under test, list commands executed, and link related issues. Include screenshots or failing trace links whenever a UI change is being verified. Note any new environment variables or secrets up front so reviewers can reproduce runs.
