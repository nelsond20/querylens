# QueryLens "Prisma" Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the QueryLens frontend as a self-explaining portfolio showcase: a landing with a live demo, a workspace app shell with a results bento, and the Prisma visual system, with Demo/Live unified.

**Architecture:** Pure, unit-tested logic (chart data, share links, scenarios) lives in `src/app/core/`, where Vitest already runs. UI is Angular 20 standalone/OnPush components with plain CSS on global tokens. Engines, stores and the worker keep their behavior. The only store touch is exporting the worker threshold constant.

**Tech Stack:** Angular 20, `@ngrx/signals`, `@angular/cdk` (Overlay, ScrollingModule), Vitest (node env, `src/app/core/**/*.spec.ts`), Playwright MCP for visual checks.

**Spec:** `docs/superpowers/specs/2026-11-19-querylens-redesign-design.md`. Read it fully before any task; section numbers below refer to it.

## Global Constraints

- No new npm dependencies. No Tailwind, chart library, icon package or UI kit.
- Fonts self-hosted in `public/fonts/` (the CSP is `font-src 'self' data:`). Download once from jsDelivr: `@fontsource-variable/inter@5.1.0/files/inter-latin-wght-normal.woff2` → `Inter-Variable.woff2`, `@fontsource-variable/bricolage-grotesque@5.1.0/files/bricolage-grotesque-latin-wght-normal.woff2` → `BricolageGrotesque-Variable.woff2`.
- UI copy in English, sentence case, no all-caps labels, no "→" appended to buttons, no exclamation marks.
- Colors only through tokens from spec §5.1. Coral (`--stage-compare`) only ever means compare.
- Component styles under the 8 kB `anyComponentStyle` warning budget (`angular.json`). Shared primitives (buttons, inputs, panel headings, chips) go in `src/styles.css`.
- Every component: `standalone: true`, `ChangeDetectionStrategy.OnPush`, `inject()`.
- `prefers-reduced-motion: reduce` disables count-ups, treemap transitions, the hero sequence and tour transitions.
- Every `localStorage` access wrapped in try/catch, and the UI works when it throws.
- Dev server for checks: `npx ng serve --host 0.0.0.0 --port 3000` (run in background). Screenshots go to `.playwright-mcp/`.
- Verification commands: `npx vitest run` (must stay green; baseline 28 tests) and `npx ng build` (no errors, no new budget warnings).

## Review Focus

1. **Imported data with odd shapes** (no `date` field, unparsable dates, null/empty strings, numbers stored as strings): the bento hides the tiles it can't compute, and there's never NaN, "Invalid Date" or an empty treemap. Pinned in Task 1 tests.
2. **A shared `?q=` link whose dataset isn't in this browser** (imported elsewhere): the workspace runs the first scenario instead of showing nothing, and toasts "That link uses a dataset that isn't in this browser". Pinned in Task 6.
3. **Shortcuts while typing**: `[` must not toggle the panel inside an input. ⌘/Ctrl+K and ⌘/Ctrl+Enter still work everywhere, and Enter in the JSON editor inserts a newline. Pinned in Task 1 (`isTypingTarget`) and Task 6.
4. **Storage or clipboard unavailable** (private window, insecure origin): theme, orientation strip and rail still render. Copy link falls back to a toast showing the URL in a selectable field. Pinned in Task 6/7 checks.
5. **Large imported dataset (~50k rows)**: the bento compute stays under ~50 ms on the main thread (single pass, no per-bucket rescans). Pinned in Task 1 with a 50k-row perf test.

---

### Task 0: Branch and housekeeping

**Files:** Modify `.gitignore`.

- [ ] **Step 1:** `git checkout -b redesign/prisma`
- [ ] **Step 2:** Append `.superpowers/` and `.playwright-mcp/` to `.gitignore`. Leave the pre-existing `package-lock.json` modification alone: don't commit or revert it.
- [ ] **Step 3:** `npx vitest run` → 28 passed. `npx ng build` → success.
- [ ] **Step 4:** Commit the spec, the plan and `.gitignore`: `git add .gitignore docs && git commit -m "docs: prisma redesign spec and plan"`.

---

### Task 1: Pure logic (bento data, share link, scenarios, typing guard)

**Files:**
- Create: `src/app/core/insights/bento-data.ts`, `src/app/core/insights/bento-data.spec.ts`
- Create: `src/app/core/serialization/share-link.ts`, `src/app/core/serialization/share-link.spec.ts`
- Create: `src/app/core/scenarios/scenarios.ts`, `src/app/core/scenarios/scenarios.spec.ts`
- Create: `src/app/core/keyboard.ts`, `src/app/core/keyboard.spec.ts`
- Modify: `src/app/store/query.store.ts` (export the constant only)

**Interfaces (produced):**
```ts
// bento-data.ts
export type BucketUnit = 'day' | 'week' | 'month';
export interface TimelineBucket { start: number; label: string; total: number; matched: number; }
export interface Timeline { field: string; unit: BucketUnit; buckets: TimelineBucket[]; }
export interface BreakdownSlice { label: string; count: number; pct: number; }   // pct = integer percent
export interface Breakdown { field: string; slices: BreakdownSlice[]; candidates: string[]; }
export function eligibleCategoryFields(fields: FieldDefinition[], rows: Record<string, unknown>[]): string[];
export function buildBreakdown(eligible: string[], results: Record<string, unknown>[], field?: string): Breakdown | null;
export function buildTimeline(fields: FieldDefinition[], allRows: Record<string, unknown>[], results: Record<string, unknown>[]): Timeline | null;
// share-link.ts
export function buildShareUrl(origin: string, query: SerializedQuery): string;
// scenarios.ts
export interface Scenario { id: string; title: string; description: string; datasetId: string; filterTree: FilterGroup; transformation: Transformation | null; }
export const SCENARIOS: Scenario[];
export const FIRST_SCENARIO_ID = 'high-value-events';
// keyboard.ts
export function isTypingTarget(target: { tagName?: string; isContentEditable?: boolean } | null): boolean;
// query.store.ts
export const WORKER_ROW_THRESHOLD = 5000;   // used in executeQuery in place of the literal
```

Rules the tests pin (from spec §8.3 and the builder-check calls):
- `eligibleCategoryFields`: `type === 'string'` fields with 2–12 distinct non-empty (`!= null && !== ''`) values across all rows, in field order.
- `buildBreakdown`: the explicit `field` if given and eligible, otherwise the first eligible field with ≥ 2 distinct values in `results`, otherwise `null`. Slices sorted by count desc. If there are more than 6 distinct values, keep the top 5 plus `{label: 'Other'}`. `candidates` = the eligible fields with ≥ 2 distinct values in results. Empty/null values are skipped.
- `buildTimeline`: the first `type === 'date'` field. Values parsed with `Date.parse`, invalid ones skipped. `null` if there's no date field or fewer than 2 valid dates in `allRows`. Unit: range ≤ 60 days → `day`, ≤ 420 days → `week` (Monday start, UTC), else `month` (UTC). Contiguous zero-filled buckets from min to max of `allRows`. `total` counts `allRows` and `matched` counts `results`. Labels: day `"12 Nov"`, week `"Week of 12 Nov"`, month `"Nov 2024"` (en-US-style short month, UTC). One pass per row array, no per-bucket rescans.

- [ ] **Step 1: Write failing tests.**
  - `bento-data.spec.ts`:
    - `eligibleCategoryFields(eventsDataset.fields, eventsDataset.rows)` → `['type']`; users → `['role','status']`; products → `['category']`.
    - A string field with 13 distinct values isn't eligible. A field with only `null`/`''` isn't eligible.
    - `buildBreakdown(['type'], rowsWithTypes(['a','a','b']))` → slices `[{label:'a',count:2,pct:67},{label:'b',count:1,pct:33}]`.
    - 8 distinct values → 6 slices, last label `'Other'`, counts sum to the input length.
    - All results share one value → `null`. An explicit `field` not in eligible → falls back to the auto pick.
    - `buildTimeline(eventsDataset.fields, eventsDataset.rows, eventsDataset.rows)` → unit `'week'`, every bucket `matched === total`, sum of totals = 1000.
    - 10 rows spread over 5 days → unit `'day'`, 5 buckets, labels like `'3 Jan'`. A 3-year range → `'month'`.
    - No date field → `null`. All dates `'not a date'` → `null`. Mixed valid/invalid → invalid ones skipped, no `NaN` in any `start`/`total`/`matched`.
    - Perf: 50,000 synthetic rows (date + 3-value string) → `buildTimeline` + `eligibleCategoryFields` + `buildBreakdown` together under 50 ms (`performance.now()`).
  - `share-link.spec.ts`: `buildShareUrl('http://localhost:3000', q)` starts with `http://localhost:3000/workspace?q=`. `deserialize(new URL(url).searchParams.get('q')!)` deep-equals `q`, including for a filter value containing `+`, `/`, `=` and non-ASCII (`'ñandú/+='`).
  - `scenarios.spec.ts`: for every scenario, its dataset exists in `BUILT_IN_DATASETS`, `execute(rows, filterTree).length > 0`, and `buildBreakdown(eligibleCategoryFields(...), results)` is not `null`. For scenarios whose dataset has a date field, `buildTimeline(...)` is not `null` and has a bucket with `matched > 0`. `SCENARIOS[0].id === FIRST_SCENARIO_ID`.
  - `keyboard.spec.ts`: `INPUT`, `TEXTAREA`, `SELECT` and `{isContentEditable:true}` → true. `BUTTON`, `DIV` and `null` → false.
- [ ] **Step 2:** `npx vitest run` → the new specs fail (modules missing).
- [ ] **Step 3: Implement.** Scenarios (move the three presets out of `workspace-page.component.ts`, adjusted):
  - `high-value-events` "High-value events", events: `value > 100 AND type in ['purchase','signup','click']`, sort `value desc`.
  - `editors-needing-attention` "Editors needing attention", users: `role = 'editor' AND status in ['inactive','pending']`, sort `createdAt asc`. Description: "Editor accounts that are inactive or still pending, oldest first."
  - `low-stock-catalog` "Low stock watchlist", products: unchanged (`stock < 30`, sort `rating desc`).
  Replace the `5000` literal in `executeQuery` with `WORKER_ROW_THRESHOLD`.
- [ ] **Step 4:** `npx vitest run` → all green (28 + new).
- [ ] **Step 5:** Commit `feat(core): bento data, share links, scenarios, typing guard`.

---

### Task 2: Prisma tokens, fonts, base styles and icons

**Files:**
- Modify: `src/styles.css` (rewrite tokens and base), `public/fonts/README.md`
- Create: `public/fonts/Inter-Variable.woff2`, `public/fonts/BricolageGrotesque-Variable.woff2` (downloaded)
- Create: `src/app/shared/ui/ql-icon/ql-icon.component.ts` (inline template, no CSS file)

**Interfaces (produced):**
- CSS tokens exactly as spec §5.1 (light on `:root`, dark on `[data-theme="dark"]`), including `--ink`, `--stage-filter|transform|compare`, `--stage-*-wash`, plus `--font-display`, `--font-ui`, `--font-mono`, radii `--r-input: 8px; --r-cond: 10px; --r-tile: 14px; --r-feature: 20px; --r-btn: 10px; --r-pill: 999px`, `--shadow-float`, `--shadow-tile` (`none` in dark).
- Type scale vars `--text-11 … --text-64` (11/12/13/14/16/20/28/40/64px).
- Global primitives (class names other tasks use): `.btn` + modifiers `.btn--primary` (filter blue), `.btn--ghost`, `.btn--quiet`, `.btn--danger`, `.btn--icon`; `.field` (input/textarea styling); `.chip`, `.chip--filter|transform|compare`; `.panel-head` (h2 + `p` description); `.kbd`; `.visually-hidden`.
- `<ql-icon name="filter" [size]="16" />` with `name: IconName`, where `IconName` = `'filter'|'transform'|'history'|'compare'|'database'|'settings'|'search'|'play'|'plus'|'x'|'chevron-down'|'chevron-right'|'sun'|'moon'|'link'|'download'|'lock'|'github'|'command'|'info'|'sort-asc'|'sort-desc'|'upload'|'monitor'`. SVGs are 16×16 viewBox, `stroke="currentColor"`, `stroke-width="1.5"`, `fill="none"`, `aria-hidden="true"`.

- [ ] **Step 1:** Download the two woff2 files (curl, URLs in Global Constraints) and check that each is > 30 kB.
- [ ] **Step 2:** Rewrite `src/styles.css`: `@font-face` for Inter and Bricolage (`font-weight: 200 800`) and Azeret Mono (kept). Remove the Archivo faces and files. Keep the existing token *names* mapped to new values (spec §5.1), so untouched components render during migration. Remove `body { overflow: hidden }` from the global scope (the app shell sets its own). Focus ring: `2px solid var(--stage-filter)`, offset 2px.
- [ ] **Step 3:** Create `ql-icon`.
- [ ] **Step 4:** `npx ng build` → success. Start the dev server and screenshot `/workspace` light and dark: the old layout with the new palette and fonts, nothing unreadable.
- [ ] **Step 5:** Commit `feat(ui): prisma tokens, fonts, primitives, icon set`.

---

### Task 3: Unify modes and split the shells

**Files:**
- Delete: `src/app/core/app-mode.service.ts`
- Modify: `src/app/app.component.{ts,html,css}`, `src/app/app.routes.ts`, `src/app/features/query-builder/dataset-selector.component.{ts,html,css}`, `src/app/pages/workspace-page/workspace-page.component.ts`, `src/app/pages/settings-page/settings-page.component.{ts,html}`, `src/app/core/theme.service.ts`
- Create: `src/app/shared/layout/marketing-nav.component.ts`, `src/app/shared/layout/marketing-footer.component.ts` (inline templates; CSS in their own files if > 20 lines)

**Interfaces:**
- Route data: `{ shell: 'marketing' }` on `landing` and `privacy`, `{ shell: 'app' }` on `workspace` and `settings`. `AppComponent` exposes `shell = signal<'marketing'|'app'>('marketing')`, set from the deepest route's data on `NavigationEnd`. Marketing renders `<ql-marketing-nav/> <router-outlet/> <ql-marketing-footer/>` in a scrolling page; app renders a bare `<router-outlet/>` in a `100dvh` overflow-hidden container (the workspace and settings pages render their own rail in Task 4).
- `ThemeService` gains `readonly preference = signal<'light'|'dark'|'system'>(…)`, `setPreference(p)`, and `isDark` becomes `computed` (preference, or `matchMedia('(prefers-color-scheme: dark)')` when `'system'`, updating live). The stored key stays `ql-theme`, with values `'light'|'dark'|'system'`; default `'system'`. `toggle()` sets the explicit opposite of the current `isDark()`. All storage is in try/catch.
- `DatasetSelectorComponent`: no `mode` input. It exposes `groups = computed(() => [{label:'Sample data', datasets: built-in}, {label:'Your data', datasets: imported}])`, filtering out empty groups. It's restyled into the top-bar switcher in Task 4.
- Remove `resetForMode` calls (AppComponent ×2, Settings ×1). Don't edit the store method. Drop `queryParamsHandling: 'merge'` from links whose only purpose was carrying `mode`.

- [ ] **Step 1:** Make the changes above. Remove the workspace effect that switches datasets on mode change, along with `isDemoMode`/`mode` (the template keeps compiling: show scenarios unconditionally and `app-data-sources-panel` always).
- [ ] **Step 2:** `grep -rn "AppModeService\|isDemo\|resetForMode\|mode()" src/app --include=*.ts --include=*.html | grep -v store/` → no matches.
- [ ] **Step 3:** `npx vitest run` green, `npx ng build` success. In the browser: `/landing` shows the marketing nav and footer and scrolls; `/workspace?mode=live` loads without error and shows built-in and imported datasets together in the selector.
- [ ] **Step 4:** Commit `refactor: unify demo/live, route-based shells, system theme`.

---

### Task 4: Workspace app shell (rail, top bar, side panels)

**Files:**
- Create: `src/app/shared/layout/app-rail.component.{ts,html,css}`, `src/app/shared/ui/ql-segmented/ql-segmented.component.ts`, `src/app/features/scenarios/scenario-runner.service.ts`, `src/app/features/scenarios/scenario-list.component.{ts,html,css}`, `src/app/pages/workspace-page/workspace-ui.service.ts`
- Modify: `src/app/pages/workspace-page/workspace-page.component.{ts,html,css}`, `dataset-selector.*`, `query-builder.*`, `filter-group.*`, `filter-condition.*`, `query-editor.*`, `transform-panel.*` (remove the internal collapse), `history-panel.*`, `data-sources-panel.*` (remove the collapse), `diff-panel.*`, `ql-select.component.css`, `src/app/pages/settings-page/*` (wrap in the rail layout)

**Interfaces (produced):**
```ts
export type RailItem = 'query' | 'transform' | 'history' | 'compare' | 'sources';
// workspace-ui.service.ts  (providedIn: 'root')
class WorkspaceUiService {
  readonly activePanel: WritableSignal<RailItem>;        // default 'query'
  readonly panelOpen: WritableSignal<boolean>;           // default true
  readonly mainTab: WritableSignal<'results' | 'diff'>;  // default 'results'
  readonly compareSnapshotId: WritableSignal<string>;    // '' = none; drives the diff
  readonly railExpanded: WritableSignal<boolean>;        // Task 7 sets it; default false
  open(panel: RailItem): void;                           // sets activePanel, panelOpen = true
  togglePanel(): void;
}
// scenario-runner.service.ts  (providedIn: 'root')
class ScenarioRunnerService {
  readonly activeScenarioId: WritableSignal<string>;     // '' when the user edits filters
  run(id: string): void;    // hydrateFrom + executeQuery + applyTransformation (logic moved from workspace runPreset)
  ensureFirstRun(): void;   // if store.lastExecutedAt() === null → run(FIRST_SCENARIO_ID)
}
// app-rail inputs: none; reads WorkspaceUiService, ThemeService, Router. On /settings, clicking an item navigates to /workspace and calls open(item).
// ql-segmented: options = input.required<{value: string; label: string; icon?: IconName}[]>(), value = input.required<string>(), valueChange = output<string>()
```
- The diff panel splits into `app-diff-controls` (snapshot picker + stat strip, writes `compareSnapshotId`, sets `mainTab('diff')`) and `app-diff-view` (full-width added/removed lists reading `compareSnapshotId`). Both stay in `features/diff/`, and the diff computation moves into a shared `computed` inside a small `DiffService` (providedIn root) so the two don't duplicate it.
- `activeScenarioId` resets to `''` whenever `store.filterTree` changes to a tree that isn't the active scenario's (an effect comparing by `JSON.stringify`).

Layout and content per spec §6, §8.1, §8.2, §8.7 ("self-describing headers"). Each side panel starts with `.panel-head`:
- Query: "Query" / "Build filters visually or edit them as JSON."
- Transform: "Transform" / "Sort, reshape or group the current results."
- History: "History" / "Save the current query as a snapshot and reload it later."
- Compare: "Compare" / "See which rows changed between the current result and a saved snapshot."
- Sources: "Your data" / "Import a JSON file or fetch records from an API. Data stays in this browser."

- [ ] **Step 1:** Build `WorkspaceUiService`, `ScenarioRunnerService` and `ql-segmented`.
- [ ] **Step 2:** Build `app-rail` (56px, `--ink`, icon buttons with `aria-label` + tooltip, active pill + 2px stage-colored marker for query/transform/compare; bottom: theme toggle, settings link, lock link to `/privacy`). When `railExpanded()` it's 200px with labels.
- [ ] **Step 3:** Rebuild the workspace template: grid `56px | 320px (when panelOpen) | 1fr`, top bar (dataset switcher, palette trigger placeholder button, copy-link placeholder, Run button with `⌘↵` `.kbd`), side panel switch on `activePanel`, main area with a `Results | Diff` tab bar (Diff disabled until `compareSnapshotId()`), results table below. Call `scenarioRunner.ensureFirstRun()` in `ngOnInit` *after* `?q` handling, and only when no valid `?q` was hydrated.
- [ ] **Step 4:** Restyle the feature components: condition rows with a `--stage-filter` left edge and 10px radius, an AND/OR pill toggle, the transform panel in violet accents, a `Visual | JSON` segmented control in the Query panel swapping `app-query-builder`/`app-query-editor`, and "Reset query" as a `.btn--quiet` at the panel bottom.
- [ ] **Step 5:** `npx ng build` (no style budget warnings). Screenshot `/workspace` at 1440×900, light and dark. Click each rail item and check the panel heading changes. Load a snapshot from History. Pick it in Compare and check the Diff tab shows the lists.
- [ ] **Step 6:** Commit `feat(workspace): app shell with rail, top bar and side panels`.

---

### Task 5: Results bento, table and empty states

**Files:**
- Create: `src/app/features/results-bento/results-bento.component.{ts,html,css}`, `metric-tile.component.ts`, `timeline-chart.component.{ts,css}`, `breakdown-treemap.component.{ts,css}`, `src/app/shared/ui/count-up.directive.ts`
- Modify: `results-table.component.{ts,html,css}`, `workspace-page.component.html`

**Interfaces:**
- `results-bento` reads `QueryStore` and computes (memoized via `computed`):
  `eligible = computed(() => eligibleCategoryFields(ds.fields, ds.rows))` (depends only on the dataset), `breakdown = computed(() => buildBreakdown(eligible(), store.results(), chosenField()))`, `timeline = computed(() => buildTimeline(ds.fields, ds.rows, store.results()))`. Charts use **`store.results()`** (filtered, untransformed). `groupBy`/`map` outputs don't have the original fields.
- `metric-tile` inputs: `label: string`, `value: number | null`, `suffix?: string`, `stage?: 'filter' | null`, `sub?: string`.
- `[qlCountUp]="value"` directive: animates textContent from the previous value to the new one over 400 ms with ease-out, formatted with `toLocaleString('en-US')` (decimals preserved to 1 place when the input has them). Under reduced motion it sets the value immediately.
- `timeline-chart` input `timeline: Timeline`. SVG `viewBox="0 0 600 120"`, `preserveAspectRatio="none"`, a dashed neutral line for `total` and a filter-blue line + wash area for `matched`, each scaled to its own max (label the tile "Rows per {unit} · result vs. full dataset"). The tile is focusable (`tabindex="0"`, `role="img"` with an `aria-label` summarizing the peak bucket). Pointer move and ←/→ set `scrubIndex`, which shows a vertical guide and a tooltip `"{label} · {matched} of {total}"`.
- `breakdown-treemap` inputs `breakdown: Breakdown`, output `fieldChange: string`. Layout: squarified is not required. Use a recursive binary split by cumulative share (alternate horizontal/vertical), absolutely positioned blocks with `transition: all 300ms` for re-flow, and tints of `--stage-filter` stepping from 100% down to 25% via `color-mix`. If `candidates.length > 1`, show a compact select in the tile header.
- Execution tile `sub`: `ds.rows.length > WORKER_ROW_THRESHOLD ? 'in a Web Worker' : 'on the main thread'`.
- Results header line (spec §8.7): `"{dataset name} · {scenario title | 'Custom query'}"` + a violet chip with the existing `transformationLabel` logic when a transformation is active. Move `transformationLabel` into the bento/header component.
- The metric row has `aria-live="polite"` with a visually hidden sentence: `"{returned} rows returned in {ms} ms"`.

- [ ] **Step 1:** Implement the components and directive above. Grid: 4 cols ≥ 1100px, 2 cols 700–1100px, 1 col below. Timeline spans 3, breakdown 1. If either chart is null, the other spans the full row; if both are null, there's no chart row.
- [ ] **Step 2:** Restyle `results-table` per spec §8.4: right-align numeric columns (use `dataset.fields` types), format date columns as `d MMM yyyy, HH:mm` with the raw value in `title`, render chips for values of eligible category fields, 36px rows (update `rowHeight`), and sort indicator via `ql-icon`.
- [ ] **Step 3:** Empty states (spec §8.5). No run yet: "Build a filter and run it, or pick a scenario" + three scenario buttons. No matches: "No rows match these filters" + "Clear filters" (`store.updateFilterTree({type:'group',op:'AND',children:[]})` then `executeQuery()`). While running: tiles at 50% opacity.
- [ ] **Step 4:** `npx ng build`. In the browser, a first load of `/workspace` shows 4 tiles with numbers, a timeline with a visible scrub tooltip on hover, and a breakdown with 3 blocks (purchase/signup/click). Switch to Products: the timeline hides and the breakdown shows categories. Run the "Editors needing attention" scenario: the breakdown shows status. Toggle a filter so nothing matches: empty state, no chart. Screenshot light and dark.
- [ ] **Step 5:** Commit `feat(results): bento with metrics, timeline and treemap; table polish`.

---

### Task 6: Command palette, shortcuts, toast, share link

**Files:**
- Create: `src/app/shared/ui/ql-toast/toast.service.ts`, `ql-toast.component.ts`, `src/app/shared/ui/ql-command-palette/command-palette.component.{ts,html,css}`, `src/app/shared/ui/ql-command-palette/command-registry.service.ts`
- Modify: `workspace-page.component.{ts,html}`, `app.component.html` (toast host), `history-panel.component.ts` (toast on save), `data-sources-panel.component.ts` (toast + select and run on import)

**Interfaces:**
```ts
class ToastService { readonly current: Signal<{ id: number; message: string; detail?: string } | null>; show(message: string, detail?: string): void; } // auto-hide 2500 ms; detail stays until dismissed
interface Command { id: string; label: string; group: 'Actions' | 'Scenarios' | 'Datasets' | 'Navigate'; icon?: IconName; shortcut?: string; run(): void; }
class CommandRegistryService { readonly commands: Signal<Command[]>; open(): void; close(): void; readonly isOpen: Signal<boolean>; }
```
- Commands (spec §8.6): Run query, Reset query, one per dataset ("Switch to {name}"), one per scenario ("Run scenario: {title}"), Open Query/Transform/History/Compare/Your data, Save snapshot (opens History and focuses its input), Copy share link, Export CSV, Export JSON (the table exposes `exportCsv`/`exportJson` publicly, or a shared `ExportService`), Import data (opens Sources), Toggle theme, Go to Settings.
- Matching: a case-insensitive substring on the label, or initials (`"rq"` → "Run query"). Arrows move, Enter runs and closes, Esc closes. The CDK Overlay is centered at 20vh with `--shadow-float`, and focus returns to the trigger on close.
- Global keydown (in `WorkspacePageComponent` via `host: {'(document:keydown)': ...}`): Mod+K toggles the palette (always). Mod+Enter runs the query (always, including in the JSON textarea). `[` toggles the panel only when `!isTypingTarget(event.target)`.
- Copy link: `buildShareUrl(location.origin, { datasetId, filterTree, transformation })` → `navigator.clipboard.writeText`. On success: toast "Link copied". On rejection or missing API: toast "Copy this link" with `detail` = the URL, rendered in a read-only selected input.
- `?q` with a missing dataset (Review Focus 2): in the workspace `?q` handler, when `deserialize` succeeds but `!store.hasDataset(id)`, toast "That link uses a dataset that isn't in this browser" and fall through to `ensureFirstRun()`.
- Import success: `store.setDataset(newId)`, `store.executeQuery()`, toast "Dataset imported".

- [ ] **Step 1:** Implement the toast, then the registry + palette, then the shortcuts, then copy link, the `?q` fallback and the import flow.
- [ ] **Step 2:** `npx ng build`. In the browser: Ctrl+K opens the palette and "low" → Enter runs the low-stock scenario. With the cursor in the history name input, `[` types a bracket and doesn't toggle the panel. Ctrl+Enter in the JSON editor runs the query. Copy link → toast. Open the copied URL in a new tab and the same query and results load. Open `/workspace?q=<serialize with datasetId 'nope'>` → toast + first scenario.
- [ ] **Step 3:** Commit `feat(workspace): command palette, shortcuts, toasts, share links`.

---

### Task 7: First-glance comprehension (orientation strip, tour, rail labels)

**Files:**
- Create: `src/app/features/onboarding/orientation-strip.component.{ts,css}`, `src/app/features/onboarding/tour.component.{ts,html,css}`, `src/app/features/onboarding/onboarding.service.ts`
- Modify: `workspace-page.component.html` (anchors: `data-tour="query"`, `"bento"`, `"rail"`, `"share"`), `app-rail.component.ts`

**Interfaces:**
```ts
class OnboardingService {
  readonly stripDismissed: WritableSignal<boolean>;   // localStorage 'ql-orientation-dismissed' === '1' (try/catch → false)
  dismissStrip(): void;                              // persists; also sets WorkspaceUiService.railExpanded(false)
  readonly tourStep: WritableSignal<number | null>;   // null = closed, 0..3
  startTour(): void; next(): void; end(): void;
}
```
- Strip copy is generated: `"You're exploring {rowCount} sample {datasetNoun}, filtered by the {scenario title} scenario. Change a filter, try another scenario, or press {⌘K|Ctrl K}."` For an imported dataset or a custom query, it's `"You're exploring {name} ({rowCount} rows). Change a filter, try a scenario, or press …"`. `datasetNoun` is the lowercase dataset name (events/users/products). The platform key comes from `navigator.platform`/`userAgent` containing "Mac".
- Actions: "Take the 30-second tour" (`.btn--ghost`) and × (`aria-label="Dismiss"`).
- On the first visit (`!stripDismissed()`), `railExpanded` starts `true`. Any rail click sets it `false` (not persisted separately; once the strip is dismissed it stays collapsed).
- The tour has 4 steps with exactly the spec §8.7 copy, a CDK Overlay `FlexibleConnectedPositionStrategy` attached to the `data-tour` element, a 2px ring in the step's stage color (filter, filter, neutral, neutral), "Next" / "Done", "{n} of 4", Esc closes, and focus moves to the callout.

- [ ] **Step 1:** Implement the service, strip, tour and rail expansion.
- [ ] **Step 2:** Browser, first visit (clear localStorage): the strip shows the correct sentence for High-value events, and the rail is expanded with labels. Run the tour through all 4 steps, each anchored to the right element. Dismiss → reload → no strip, collapsed rail. In DevTools, make `localStorage.getItem` throw (`Object.defineProperty`) → the page still renders with the strip.
- [ ] **Step 3:** Commit `feat(onboarding): orientation strip, guided tour, expanded rail on first visit`.

---

### Task 8: Landing page

**Files:**
- Modify: `src/app/pages/landing-page/landing-page.component.{ts,html,css}`
- Create: `src/app/pages/landing-page/hero-demo.component.{ts,html,css}`, `src/app/pages/landing-page/capabilities-bento.component.{ts,html,css}`

**Interfaces:**
- `hero-demo`: `chips = signal([{id:'type', label:'type = purchase', on:false, node: {...eq purchase}}, {id:'value', label:'value > 100', ...gt 100}, {id:'time', label:'timestamp ≥ 2024-07-01', ...gte '2024-07-01'}])`. `result = computed(() => execute(eventsDataset.rows, {type:'group', op:'AND', children: onNodes}))`, with `ms` measured around `execute` (`performance.now()`, 1 decimal). On init (unless reduced motion), turn the chips on at 400/750/1100 ms with `setTimeout`, cleared on destroy. Reduced motion: all on immediately. Each chip is a `button` with `aria-pressed`. The "Open this query in the workspace" link uses `buildShareUrl(location.origin, …)` and navigates via router (path + `q`).
- Hero copy, CTAs, bento cells and the "How it's built" strip: exactly per spec §7.1 and §7.2, with the Web Worker wording from the builder-check calls. GitHub URL `https://github.com/nelsond20/querylens` (`target="_blank" rel="noopener"`).
- The spectrum highlight on "without leaving your browser": `background: linear-gradient(90deg, var(--stage-filter-wash), var(--stage-transform-wash), var(--stage-compare-wash))`, `border-radius: 8px`, `box-decoration-break: clone`.

- [ ] **Step 1:** Build `hero-demo`, then `capabilities-bento` (static fragments using global primitives and stage chips, with asymmetric `grid-template-areas` on desktop and one column on mobile), then the landing page composition.
- [ ] **Step 2:** `npx ng build`: the landing chunk has no budget warning. Browser: the sequence plays once and the count drops at each chip. Toggling chips updates the count and the mini table. "Open this query in the workspace" opens the workspace with the same three conditions. Screenshot at 1440 and 390 widths, light and dark.
- [ ] **Step 3:** Commit `feat(landing): live hero demo and capabilities bento`.

---

### Task 9: Settings and Privacy

**Files:** Modify `src/app/pages/settings-page/*`, `src/app/pages/privacy-page/*`.

- Settings (inside the rail layout from Task 4), spec §10: "Appearance" with `ql-segmented` Light/Dark/System (icons sun/moon/monitor) bound to `ThemeService.preference`, and "Local data" with a two-step confirm: the first click changes the label to "Click again to confirm" for 4000 ms, the second click runs the existing `clearLocalWorkspace()` and toasts "Local workspace cleared".
- Privacy (marketing shell): article layout max 68ch, Bricolage headings, same content. Remove the "Legal Transparency" eyebrow. The return link becomes "Back to the workspace".

- [ ] **Step 1:** Implement both.
- [ ] **Step 2:** Browser: the theme segmented control switches live, and System follows an emulated `prefers-color-scheme` (Playwright `emulateMedia`). The two-step clear works and reverts after 4 s.
- [ ] **Step 3:** Commit `feat(pages): settings and privacy in the prisma system`.

---

### Task 10: Mobile, accessibility and cleanup

**Files:** the workspace/rail/top-bar/bento CSS, `app.component.css`, `public/fonts/*`, `README.md` (the screenshots section only, if one exists; otherwise none).

- Below 900px (spec §12): the rail becomes a fixed bottom tab bar (icons + 11px labels, safe-area padding), the side panel becomes a bottom sheet (max 75dvh, drag handle visual, closes via the same rail item or a × button), and the top bar shows dataset + palette icon + Run. The page scrolls vertically, and the table keeps its virtual viewport with a fixed 420px height.
- Remove leftovers: Archivo files, the `route-pulse` CSS/TS, unused classes, unused tokens.
- [ ] **Step 1:** Implement the mobile layout.
- [ ] **Step 2:** Keyboard pass: tab through landing → workspace (rail, top bar, panel, bento tiles, table headers). Every stop has a visible ring, and none is trapped except in the palette/tour (Esc exits).
- [ ] **Step 3:** Contrast check: compute ratios for `--text-muted` on `--surface-hi` and white on `--stage-transform`/`--stage-filter` in both themes (small node script in scratch, not committed). Adjust tokens until all are ≥ 4.5:1 for text.
- [ ] **Step 4:** `npx vitest run` green. `npx ng build` with no warnings. Final screenshots: landing, workspace and settings at 1440×900 and 390×844, light and dark.
- [ ] **Step 5:** Commit `feat: mobile layout, a11y pass, cleanup`.
