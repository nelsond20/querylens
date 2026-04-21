# QueryLens

QueryLens is a frontend-only analytics workbench built with Angular + Signals.
It lets you build visual filters, edit query JSON, transform results, compare snapshots, and share analysis state through URL encoding.

The project is designed as a portfolio-grade product surface, not a static template.

## Why This Project Matters

QueryLens demonstrates the type of work expected in real product engineering:

- structured state management for complex UI flows
- deterministic query engine and transformation pipeline
- scalable table rendering with virtual scrolling
- practical analysis workflows: saved snapshots, diff analysis, and exports
- no backend dependency while preserving real analyst-style interactions

## Core Product Capabilities

- **Visual Query Builder**
  - nested `AND/OR` logic groups
  - dynamic operators by field type
  - list-based operators (`in`, `notIn`) with comma input
- **JSON Editor Sync**
  - two-way sync between visual builder and raw JSON
  - strict validation feedback
- **Execution + Metrics**
  - rows scanned, rows returned, match rate, execution time
  - dataset-aware runtime pipeline
- **Transformation Studio**
  - `sort`, `map`, and `groupBy`
  - reversible transformation state
- **Results Workspace**
  - virtualized rendering for large result sets
  - in-result quick search
  - local sorting by clicking column headers
  - CSV/JSON export from current visible rows
- **History + Diff**
  - save and reload query snapshots in `localStorage`
  - compare current result set vs. historical snapshots
  - added/removed/unchanged insights
- **Shareable URLs**
  - full query state encoded as `?q=...`
  - reproducible analysis sessions
- **Scenario Lab**
  - realistic one-click analysis presets for instant demo flow
- **Live Data Sources**
  - upload CSV/JSON files and convert them into runtime datasets
  - fetch records from external APIs (with optional bearer token and custom headers)
  - persist imported datasets in localStorage for future sessions

## Tech Stack

- Angular 20 (standalone components)
- `@ngrx/signals` for global state
- Angular CDK Virtual Scroll
- TypeScript strict mode
- Vitest for core engine tests

## Architecture

- `src/app/core`: framework-agnostic domain logic
- `src/app/store`: signal stores and app state orchestration
- `src/app/features`: focused UI feature modules
- `src/app/workers`: optional query worker for very large datasets

This separation keeps core query behavior testable and reusable outside Angular rendering concerns.

## Run Locally

```bash
npm install
npm start
```

Open `http://localhost:4200`.

## Build

```bash
npm run build
```

## Tests

Core query/transform/serializer/diff tests:

```bash
npm run test:core
```

Angular/Karma tests are available for store specs, but require a local Chrome binary.

## Suggested Demo Flow (for recruiters)

1. Open Scenario Lab and run **High-Value Events**.
2. Show KPI strip updates (`rows`, `match rate`, `execution time`).
3. Modify a condition in the visual builder and rerun.
4. Save a snapshot in **Query History**.
5. Change query, rerun, then open **Diff Analysis**.
6. Upload a real CSV or fetch an API dataset from **Live Data Sources**.
7. Export visible rows as CSV.
8. Click **Share Workspace** and open the copied URL in a new tab.

This sequence shows product thinking, state control, and implementation depth in under 90 seconds.
