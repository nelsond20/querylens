# QueryLens redesign: "Prisma"

Date: 2026-11-19
Status: awaiting owner approval of this document

**Calls made by Claude (not explicitly decided by the owner), for review:**
- UI stays in English; light + dark themes kept, plus a "System" option.
- Execution tile states truthfully where the query ran (main thread vs Web Worker). The landing copy doesn't over-claim the worker.
- Breakdown-field rule (eligible = 2–12 distinct values in the whole dataset) and the first scenario adjusted so both charts show on the first screen.
- New "Copy share link" (the README promises it, the UI lacks it), command palette, toasts.
- First-visit orientation strip, an optional 30-second tour, and the rail expanded with labels until first interaction.
- Fonts: Bricolage Grotesque + Inter (self-hosted); Azeret Mono kept only for JSON; Archivo removed.
- Mobile: bottom tab bar + bottom sheet below 900px.

## 1. Intent and the why

QueryLens is a portfolio piece. The people who open it are evaluators: recruiters, hiring managers and engineers who give it a few minutes, often without reading the README. Today the product works but doesn't show it. The landing is a wordmark, three chips and a button. The workspace opens in Live mode with an empty upload panel. All the tools are stacked in one long sidebar, and the metrics are a line of grey text.

The redesign has one job: **within the first 30 seconds an evaluator sees real data, uses a real interaction, and notices the engineering behind it** (client-side query engine, Signals, Web Worker, virtual scroll), while the product feels polished and easy to use. The owner explicitly accepts losing the current visual identity.

## 2. Goals, non-goals, anti-goals

**Goals**
- A landing that demonstrates the product with a live, working mini query, followed by a capabilities bento where each cell shows its feature in action.
- A workspace rebuilt as an application shell. Results stay visible at all times, and the tools are one click (or one keystroke) away instead of buried in a scroll.
- A results "bento": metric tiles plus two derived visualizations (time series and category breakdown), inspired by the 21st.dev "Analytics Bento" (SVG only, scrubbable line, re-flowing treemap, count-up numbers).
- First visit lands on a scenario already run, with both charts populated and a one-line orientation strip, so an evaluator understands what they're looking at without reading anything else (section 8.7).
- **One unified experience.** The Demo/Live split is removed. Sample datasets, scenarios and imported data live side by side (section 9).
- One coherent visual system ("Prisma"), with light and dark themes, applied to every route.

**Non-goals**
- No changes to the query engine, transform engine, diff engine, serializer, stores or worker (`src/app/core/**`, `src/app/store/**`, `src/app/workers/**`) beyond what section 9 explicitly lists.
- No new runtime dependencies (no Tailwind, no chart library, no icon package, no UI kit). Angular + `@angular/cdk` (already installed) only.
- No i18n. The UI stays in English.
- No backend, analytics or tracking.

**Anti-goals** (failure even if it "works")
- It reads as a generic SaaS template: identical rounded cards everywhere, gradient washes, a big-number hero.
- Color used as decoration. In Prisma, color means a pipeline stage. If a color doesn't say "filter", "transform" or "compare", it shouldn't be there.
- The evaluator lands on an empty screen, or has to read instructions before seeing data.
- The rest of the motion and animation drowns out the one hero moment.
- Regressions in existing behavior: shared `?q=` URLs, history in localStorage, import/fetch of datasets, CSV/JSON export, virtual scrolling.

## 3. Constraints

- Angular 20 standalone components, `ChangeDetectionStrategy.OnPush`, signals, `@ngrx/signals` stores. New components follow the same conventions (standalone, OnPush, `inject()`, signal inputs/outputs where practical).
- Plain CSS: global tokens in `src/styles.css`, component styles in each component's `.css`. Theme switching through `[data-theme="dark"]` on `<html>` (already handled by `ThemeService`).
- Fonts are self-hosted in `public/fonts/` (the current pattern). No Google Fonts link at runtime.
- External components used as references (21st.dev React/Tailwind, Seline styles) are **re-implemented in Angular**, never installed.
- Vitest suite (`npm run test:core`) must pass before and after. Dependencies are not installed in the dev container yet (`npm ci` is the first step).
- Dev server for previews in this environment: `ng serve --host 0.0.0.0 --port 3000` (the container only publishes 3000 and 5173).

## 4. Approaches considered

**Structure** (chosen: A)
- **A. Showcase + real app.** A landing with a live demo and a capabilities bento, plus the workspace rebuilt as an app shell with a results bento. Most work, biggest impact, and the only one that fixes the overloaded sidebar. **Chosen.**
- B. Visual reskin on the current layout. Cheapest, but keeps the stacked sidebar and doesn't deliver the restructuring that was asked for.
- C. No landing: open straight into a demo workspace with a welcome panel. Fastest "wow", but loses the place to explain the engineering, which is exactly what evaluators look for.

**Visual direction** (chosen: Prisma). Mockups of all three: `.superpowers/brainstorm/*/content/visual-direction-v2.html`
- A. Papel: Seline-style warm stone canvas, single cyan. Calm and editorial, but the safest and the most common look among analytics sites.
- B. Grafito: dark precision instrument with a periwinkle accent (Linear/Raycast vernacular). Feels very "pro", but dark-first apps look alike.
- **C. Prisma: "the lens splits data into a spectrum".** Each pipeline stage owns a hue, so color is navigation. Bricolage Grotesque headings. The most memorable in 30 seconds. **Chosen.**

## 5. Visual system

### 5.1 Color tokens

Replace the current oklch palette in `src/styles.css`. Keep the existing token *names* where they map one to one (`--bg`, `--surface`, `--surface-hi`, `--border`, `--border-sub`, `--text`, `--text-soft`, `--text-muted`, `--accent`, `--on-accent`, `--success`, `--error`), so untouched styles keep working during the migration, and add the new stage tokens.

| Token | Light | Dark | Use |
|---|---|---|---|
| `--bg` | `#f3f4f8` | `#0f1117` | Page canvas |
| `--surface` | `#ffffff` | `#171a23` | Panels, tiles, table |
| `--surface-hi` | `#f8f9fc` | `#1d212c` | Side panel, table header, sunken inputs |
| `--border-sub` | `#eef0f5` | `#222632` | Row separators |
| `--border` | `#e3e5ee` | `#2b3040` | Structural hairlines |
| `--text` | `#14161f` | `#eceef4` | Primary text |
| `--text-soft` | `#3c4152` | `#c3c7d4` | Secondary text |
| `--text-muted` | `#6b7084` | `#8b90a3` | Helper text, labels |
| `--ink` | `#14161f` | `#0a0b10` | App rail background (dark in both themes) |
| `--stage-filter` | `#3d6bff` | `#7393ff` | Filter / query stage, primary action |
| `--stage-transform` | `#8a5cf6` | `#a689ff` | Transform stage |
| `--stage-compare` | `#ff6b4a` | `#ff8a6e` | Compare / diff stage |
| `--stage-*-wash` | 10% tint of each | 16% tint of each | Chips, selected rows, chart areas |
| `--accent` | = `--stage-filter` | = `--stage-filter` | Kept as an alias |
| `--on-accent` | `#ffffff` | `#0f1117` | Text on accent |
| `--success` | `#1f9d6b` | `#3fc28e` | Only for "added rows" and import success |
| `--error` | `#d6453d` | `#ff7a72` | Only for validation errors and "removed rows" |

Rules:
- **Stage color is semantic.** Anything belonging to filtering (condition edges, the AND/OR chip, the Run button, returned/match tiles, the result series) uses `--stage-filter`. The transform panel, the transform tile and the transformed-state badge use `--stage-transform`. The compare panel and diff view use `--stage-compare`. Neutral things (history, sources, settings, scanned/exec metrics) stay neutral.
- This corrects the mockup, where the "match" tile was coral. In the build, coral only ever means compare.
- The one decorative use of the spectrum is the logo mark (a small conic gradient of the three stages) and the hero highlight (section 7). Nowhere else.
- Contrast: text on `--surface` and on the washes must meet WCAG AA. Check `--text-muted` on `--surface-hi` and white on `--stage-transform` specifically.

### 5.2 Typography

- **Bricolage Grotesque** (variable, self-hosted woff2, opsz + wght) for display and headings, weight 600 at display sizes and 500–600 for panel headings, with letter-spacing −0.02 to −0.03em on sizes ≥ 24px.
- **Inter** (variable, self-hosted woff2) for all UI and body. 13–14px is the base UI size, with `font-variant-numeric: tabular-nums` on metrics, table cells and counts.
- **Azeret Mono** (already in the repo) only for the JSON editor and inline code. No monospace labels anywhere else.
- Remove Archivo (files and `@font-face`) once nothing references it.
- Scale (rem at a 16px root): 11 / 12 / 13 / 14 / 16 / 20 / 28 / 40 / 64px. The landing display uses 64px desktop / 40px mobile.
- Sentence case everywhere. No all-caps eyebrows, no tracked-out labels.

### 5.3 Shape, elevation, motion

- Radii by hierarchy, not one radius for everything: inputs and chips 8px; condition rows 10px; tiles, table and panels 14px; landing feature cells 20px; buttons 10px. Pills (99px) only for status chips and the AND/OR toggle.
- Borders are the main structural device. Shadow only on floating layers (command palette, select menus, toasts: `0 12px 40px rgba(20,22,31,.16)`) and a faint `0 2px 8px rgba(20,22,31,.05)` on bento tiles in light mode. No shadows in dark mode, where borders do the work.
- Motion tokens: keep `--dur-*` and `--ease-*`. The **one orchestrated moment** is the landing hero demo (section 7.1). In the workspace, motion only answers user actions: count-up on metric change (≤ 400ms), treemap re-flow (≤ 300ms), palette open/close, panel switch (fade ≤ 150ms). Remove the current `route-pulse` animation. Everything respects `prefers-reduced-motion: reduce` (values jump, no transitions).

### 5.4 Icons

A small `ql-icon` component with inline 16px SVGs, 1.5px stroke, `currentColor`: filter, transform, history, compare, database, settings, search, play, plus, x, chevron, sun, moon, link, download, lock, github, command. No icon font, no package.

## 6. App shell and navigation

There are two shells:

1. **Marketing shell** for `/landing` and `/privacy`: a slim top nav with the logo mark + "QueryLens" on the left, and "Workspace", "GitHub" (https://github.com/nelsond20/querylens) and the theme toggle on the right. The page footer holds the privacy line and the tech strip.
2. **App shell** for `/workspace` and `/settings`: a dark vertical rail (`--ink`, 56px) on the left in both themes, and the page content to the right. The current global header (privacy note, demo/live switch, theme toggle) and the global privacy footer are removed from these routes. The demo/live switch disappears entirely (section 9), and the other functions move as described below.

`AppComponent` decides which shell to render, based on route data (`data: { shell: 'marketing' | 'app' }` in `app.routes.ts`).

**Rail contents** (top to bottom): logo mark (links to `/landing`), Query, Transform, History, Compare, Sources, a spacer, then theme toggle, Settings and a lock icon that opens `/privacy` (tooltip: "Runs locally, no data leaves your browser"). Each rail item has an icon, a tooltip and an `aria-label`. The active item shows a pill background and, for stage items, a 2px left marker in its stage color. Rail items on `/workspace` switch the side panel (section 8.2). From `/settings` they navigate to `/workspace` with that panel open.

## 7. Landing (`/landing`)

Layout, desktop (max content width 1200px, left-aligned text):

```
┌────────────────────────────────────────────────────────────┐
│ ◈ QueryLens                       Workspace  GitHub  ☾     │
├────────────────────────────────────────────────────────────┤
│ Query, transform and compare      ┌──────────────────────┐ │
│ data without leaving your         │ events · 1,000 rows   │ │
│ browser.                          │ [type = purchase ✓]   │ │
│                                   │ [value > 100 ✓] [+US] │ │
│ One-paragraph plain description.  │ 312 of 1,000 · 4 ms   │ │
│ [Open the workspace] [GitHub]     │ ┌ mini table (5) ───┐ │ │
│                                   │ └───────────────────┘ │ │
│                                   └──────────────────────┘ │
├────────────────────────────────────────────────────────────┤
│ Capabilities bento (asymmetric, 3 cols × 3 rows)            │
├────────────────────────────────────────────────────────────┤
│ "How it's built" strip  ·  footer with privacy line         │
└────────────────────────────────────────────────────────────┘
```

### 7.1 Hero (the memorable moment)

- Headline (Bricolage 64px/600): "Query, transform and compare data without leaving your browser." The phrase "without leaving your browser" gets the spectrum highlight: a soft three-stop wash (`--stage-filter-wash` → `--stage-transform-wash` → `--stage-compare-wash`) behind the text, with text kept at `--text`. It's the only highlight on the site.
- Subcopy (16px, ≤ 60ch): what it is in plain words. Visual filters, a JSON editor, transformations, snapshots and diffs, all running locally, with large datasets moved to a Web Worker so the interface stays responsive. (Don't claim the worker for every query; see 8.3.)
- CTAs: primary "Open the workspace" (`--stage-filter`, navigates to `/workspace`, which runs the first scenario on a first visit), secondary ghost "View source" (GitHub). No arrows appended to the labels.
- **Live demo card** (right column, stacks under the text on mobile). It runs the **real engine** (`execute(rows, tree)` from `core/query-engine/query-engine.ts`) against the built-in `events` dataset (fields: eventId, userId, type, timestamp, value), synchronously on the main thread (1,000 rows is trivial):
  - 3 toggleable condition chips (filter blue edge when on), combined with AND: `type = purchase`, `value > 100`, and `timestamp ≥ 2024-07-01`. If `execute` doesn't compare ISO date strings correctly with `gte`, use `userId startsWith "usr-1"` as the third chip instead. Each chip must visibly reduce the count.
  - A live line: "{returned} of {scanned} rows · {ms} ms", with a count-up on change.
  - A mini table of the first 5 matching rows (4 columns), updating on each toggle.
  - On load, an orchestrated sequence plays once: the chips turn on one by one (~350ms apart) and the count drops each time, then the card rests and the visitor takes over. With reduced motion, it starts in the final state.
  - A small text link under the card: "Open this query in the workspace". It builds a `?q=` URL with the existing `serialize()` and navigates to `/workspace?q=…`.

### 7.2 Capabilities bento

An asymmetric grid of 7 cells with mixed spans (no two adjacent cells the same size), 20px radius, a 1px border, white surface. Each cell has a short title (16px Bricolage), one line of description, and a **static but real-looking UI fragment** rendered with the app's own components or styles (not screenshots, no animation except where noted):

1. Visual query builder (large, spans 2): a nested AND/OR group with 3 conditions. Filter blue.
2. JSON sync: the same filter as formatted JSON (Azeret Mono). Filter blue.
3. Transformations: a sort/group-by chip row and a tiny grouped bar list. Transform violet.
4. Snapshots and diff: a "+12 added / −4 removed / 296 unchanged" strip. Compare coral (with success/error for the +/−).
5. Virtual scrolling: a narrow column of rows with "Renders only the rows you can see". Neutral. **No performance claims that aren't measured.**
6. Shareable URLs: a fake address bar with a `?q=` string and a copy icon. Neutral.
7. Bring your own data: JSON file / API URL inputs. Neutral.

Below that sits a "How it's built" strip: 4 short items (Angular 20 standalone + Signals, `@ngrx/signals` store, Web Worker execution for datasets over 5,000 rows, CDK virtual scroll), each with one sentence. Then the footer: the privacy line with a link to `/privacy`, and the MIT license.

Mobile: a single column. The demo card comes right after the CTAs, and the bento cells stack in the order listed.

## 8. Workspace (`/workspace`)

### 8.1 Layout

```
┌──┬──────────────────────────────────────────────────────────────┐
│◈ │ [● Events ▾ 1,000 rows · sample]   ⌘K Search…     [⇪] [▶ Run ⌘↵]│
│  ├──────────────────────────────────────────────────────────────┤
│  │ ⓘ orientation strip (first visit, dismissible, section 8.7)   │
│▣ ├──────────────┬───────────────────────────────────────────────┤
│⇅ │ SIDE PANEL   │ [Results | Diff]                               │
│↺ │ (320px)      │ ┌scanned┐┌returned┐┌match┐┌exec┐                │
│± │ content of   │ ┌ timeline (span 3) ─────────┐┌ breakdown ─┐   │
│⛁ │ active rail  │ └────────────────────────────┘└────────────┘   │
│  │ item         │ ┌ table toolbar: search · CSV · JSON ─────────┐ │
│⚙ │              │ │ virtualized table (fills remaining height)   │ │
└──┴──────────────┴───────────────────────────────────────────────┘
```

- The workspace fills the viewport height (`100dvh`). The table scrolls internally; the page itself doesn't scroll on desktop.
- **Top bar**: dataset switcher (dot + name + row count + a "sample" or "imported" tag; opens a menu with two groups, "Sample data" (built-in) and "Your data" (imported), and an "Import data…" entry at the bottom that opens Sources), command palette trigger (looks like a search field, shows ⌘K / Ctrl K depending on platform), "Copy link" icon button (new, see 8.6), and the Run button (`--stage-filter`, label "Run query", shows the ⌘↵ hint, spinner state "Running…").
- The **side panel** (320px, `--surface-hi`, collapsible with the active rail item or `[`) shows the content of the active rail item.

### 8.2 Side panel contents per rail item

| Rail item | Panel content (existing component, restyled) |
|---|---|
| Query (default) | A "Scenarios" list at the top, always available (the 3 presets as compact cards: title + one-line description + dataset; the active one highlighted, collapsible to a single row once the user edits filters). Then the filter builder (`app-query-builder`) with a "Visual / JSON" segmented control that switches to `app-query-editor` in the same space. "Reset" goes at the bottom as a quiet text button. The dataset selector moves to the top bar and leaves this panel. |
| Transform | `app-transform-panel`, always expanded (the internal toggle is removed), with Apply/Clear. An active transformation shows as a violet chip in the results header. |
| History | `app-history-panel`: save field + snapshot list (Load / Delete). |
| Compare | `app-diff-panel` controls: snapshot picker + the added/removed/unchanged stat strip. Picking a snapshot enables and switches to the "Diff" tab in the main area, where the two-column added/removed lists render with full width. |
| Sources | `app-data-sources-panel` (file import, API fetch, imported list), always expanded and always usable. A successful import selects the new dataset, runs an empty query on it (all rows) and shows the toast "Dataset imported". |

The first visit opens Query. The active rail item is kept in a signal (and optionally in `localStorage` as a convenience; must not throw if storage is unavailable).

### 8.3 Results bento

A responsive grid: 4 columns ≥ 1100px, 2 columns between 700 and 1100px, 1 column below.

- **Metric tiles** (4): "Rows scanned" (neutral), "Rows returned" (filter blue top edge), "Match rate" (filter blue), "Execution" (neutral) with a truthful sub-label: "in a Web Worker" when the dataset is above the store's worker threshold (`rows.length > 5000` in `QueryStore.executeQuery`), otherwise "on the main thread". *(Builder-check call: the built-in datasets are ≤ 1,000 rows and never use the worker, so the label must not claim it. Export the threshold as a named constant from `query.store.ts` so the UI and the store share it. That's the only allowed touch to the store file and it doesn't change behavior.)* Values in Bricolage 28px tabular, with a count-up on change. Before the first run, the tiles show "—" and the panel shows the empty state (8.5).
- When a transformation is active, a fifth state appears: the header gets the violet "Sorted by value ↓" / "Grouped by country (sum value)" chip, using the existing `transformationLabel` logic.
- **Timeline tile** (span 3, hidden if the dataset has no `date` field): rows per time bucket for the **current result set** (filter-blue line + wash area) against the **whole dataset** (dashed neutral line). Bucket size is picked automatically from the date range (day / week / month, aiming for 12–60 buckets). Pointer and keyboard scrub: a vertical guide plus a tooltip showing "{bucket label} · {n} of {total}". Left/right arrows move the scrub when the tile is focused. Built as inline SVG, no library.
- **Breakdown tile** (span 1, hidden if no suitable field): a treemap of the current results over a categorical field. *(Builder-check call.)* A `string` field is **eligible** when it has 2–12 distinct values across the **whole dataset**, so ids, names and emails never qualify. Of the eligible fields, use the first one with ≥ 2 distinct values **in the current results**. If none has, hide the tile. If more than 6 values are present, show the top 5 + "Other". For the built-in data this yields `type` (events), `role`/`status` (users) and `category` (products). The table's enum chips use the same eligibility rule. Blocks use tints of `--stage-filter`, labeled "{value} {pct}%". Blocks animate position/size on change (FLIP or CSS transitions on grid tracks), and can be skipped under reduced motion. If several fields qualify, a tiny field switcher appears in the tile header.
- If both chart tiles are hidden, the metric row stands alone.
- Chart data comes from pure functions in a new `src/app/features/results-bento/bento-data.ts` (bucketing, breakdown selection), unit-tested with Vitest. These run on the main thread over `displayedResults()` and the dataset rows. They are O(n), and the built-in datasets are ≤ 1,000 rows. Computation must stay responsive for imported datasets up to ~50k rows. If it can't, it's acceptable to sample or debounce; that's the builder's call.

### 8.4 Table

`app-results-table` keeps its logic (virtual scroll, quick search, header sort, CSV/JSON export). Restyle only:
- The toolbar inside the table card: "{visible} rows" (+ "of {total}" when filtered by the quick search), search input, and CSV and JSON as quiet icon+label buttons.
- Header 12px `--text-muted` on `--surface-hi`, sort indicator as a chevron icon; rows 36px, hairline separators, tabular numbers, numbers right-aligned.
- Values matching an enum-like string field (the same rule as the breakdown) render as small chips. Dates render formatted (`d MMM yyyy, HH:mm`), with the raw value in the `title`.
- Hover row: `--surface-hi`. In the Diff tab, added rows get a success-wash edge and removed rows an error-wash edge.

### 8.5 Empty, loading and error states

- **No run yet** (only reachable after "Reset query", since a first visit auto-runs a scenario): "Build a filter and run it, or pick a scenario" with the ⌘↵ hint and the three scenario buttons inline.
- **Running:** the Run button spinner; tiles keep the previous values at 50% opacity.
- **Invalid JSON in the editor:** inline error under the editor in `--error` (existing `rawQueryError`), and Run disabled.
- **No matches:** the tiles show 0, the charts hide, and the table area reads "No rows match these filters" with a "Clear filters" action.
- **Import/fetch errors:** stay inline in the Sources panel (existing messages), restyled.

### 8.6 Command palette and keyboard

- A `ql-command-palette` component on CDK Overlay, opened with ⌘K / Ctrl K or the top bar trigger, closed with Esc or on backdrop click. It's a fuzzy-filtered list (a simple substring/initials match is enough), arrow keys to move, Enter to run.
- Commands: Run query, Reset query, Switch dataset → (one entry per dataset), Run scenario → (one entry per scenario), Open panel → (Query, Transform, History, Compare, Sources), Save snapshot, Copy share link, Export CSV, Export JSON, Import data, Toggle theme, Go to Settings.
- Global shortcuts (ignored while typing in inputs/textarea, except ⌘↵ inside the JSON editor): ⌘/Ctrl+Enter runs the query, ⌘/Ctrl+K opens the palette, `[` toggles the side panel.
- **Copy share link (new, small):** builds `location.origin + /workspace?q=` + `serialize({ datasetId, filterTree, transformation })` (the existing serializer and the same shape `deserialize` reads), copies it with `navigator.clipboard.writeText`, and confirms with a toast "Link copied". The README already advertises shareable URLs, but there's currently no UI that generates them.
- A minimal `ql-toast` (a single message, auto-dismisses after 2.5s, `role="status"`) for "Link copied", "Snapshot saved" and "Dataset imported".

### 8.7 First-glance comprehension

The workspace has to explain itself to someone who skipped the landing (for example, a recruiter who followed a direct link).
- **Orientation strip:** shown on the first visit under the top bar. One line plus actions: "You're exploring 1,000 sample events, filtered by the High-Value Events scenario. Change a filter, try another scenario, or press ⌘K." Actions: "Take the 30-second tour" and dismiss (×). Dismissal is remembered in localStorage, wrapped in try/catch; if storage fails, the strip just shows again. The sentence is generated from the current dataset and scenario, so it stays true if the user switched before dismissing.
- **30-second tour:** 4 anchored callouts using CDK Overlay, with Next / Done and Esc to quit: (1) scenarios and the filter builder ("Filters are a visual AND/OR tree, synced with JSON"), (2) the results bento ("Metrics and charts update on every run"), (3) the rail ("Transform, save snapshots, compare runs, bring your own data"), (4) the Copy link button ("Every query is a shareable URL"). Each callout shows a matching stage color. It doesn't start automatically.
- **Labels over icons:** the rail shows tooltips on hover/focus, and on the first visit the rail is temporarily expanded (icon + label, 200px) until the strip is dismissed or the user clicks any rail item. After that it collapses to icons. This shows what's there without cluttering later use.
- **Self-describing headers:** every side panel starts with a heading and one line of description (for example, Compare: "See which rows changed between the current result and a saved snapshot."), and the results area header states the active context: "{dataset} · {scenario name or 'Custom query'} · {transformation chip}".

## 9. Behavior changes outside templates/CSS

These are the only logic changes:
1. **Unify Demo and Live (decided by the owner).** There is no mode anymore.
   - Remove `AppModeService` and every use of it: `AppComponent` (the `?mode` subscription, `setExperience`, the header switch), `WorkspacePageComponent` (`isDemoMode`, `mode`, and the effect that switches datasets on mode change), `DatasetSelectorComponent` (the `mode` input and filtering, which now lists all datasets grouped by `source`), and `SettingsPageComponent` (the Experience section).
   - `QueryStore.resetForMode` stays in the store untouched but is no longer called from the UI. Removing it is optional cleanup only if its spec doesn't depend on it; don't change store behavior.
   - A legacy `?mode=` param is accepted and ignored (old shared links keep working). Navigation no longer needs `queryParamsHandling: 'merge'` for mode.
   - Nothing is reset by in-app navigation anymore: the store lives for the whole SPA session. Only imported datasets and history persist in localStorage (unchanged). The current query doesn't persist today and won't, so a full reload runs the first scenario again, with imported datasets still in "Your data".
   - A first visit to `/workspace` runs the first preset ("High-Value Events") if no `?q` is present and nothing has been run yet in this session. *(Builder-check call: today that preset (`type = purchase AND value > 100`) returns one event type, so the breakdown tile would hide on the first screen evaluators see. Change it to `value > 100 AND type in [purchase, signup, click]`, sorted by value desc, so the first screen shows both the timeline and a 3-block breakdown. Presets live in `workspace-page.component.ts`, not in core. Check the other two presets the same way and adjust them if a chart would hide.)*
2. Shell selection via route data (section 6).
3. Orientation strip, tour and first-visit rail expansion (section 8.7).
4. The share-link command, the toast and the palette (section 8.6).
5. New pure bento data functions (section 8.3) with tests.

`QueryStore`, `HistoryStore`, the engines, the serializer and the worker don't change. If a component needs a derived value, it computes it locally or in the new bento utilities.

## 10. Settings and Privacy

- **Settings** (app shell): a single column, max 640px, two sections separated by hairlines rather than cards (the Experience section goes away with the unified mode). "Appearance" (Light / Dark / **System** segmented control; System follows `prefers-color-scheme`, a small `ThemeService` extension storing `'system'`), "Local data" (description + a destructive "Clear local workspace" button in `--error` outline, behind a confirm step: the button changes to "Click again to confirm" for 4 seconds).
- **Privacy** (marketing shell): a readable article layout, max 68ch, Bricolage headings, Inter body at 16px/1.65. Same content, restyled.

## 11. Component inventory

**New** (under `src/app/shared/ui/` unless noted): `ql-icon`, `ql-app-rail`, `ql-top-bar` (workspace), `ql-segmented` (Visual/JSON, theme), `ql-orientation-strip`, `ql-tour`, `ql-command-palette`, `ql-toast` (+ a tiny `ToastService`), `ql-metric-tile`, `ql-timeline-chart`, `ql-breakdown-treemap`; `features/results-bento/` (bento container + `bento-data.ts` + spec); `pages/landing-page/` subcomponents for the hero demo card and the capabilities bento; a marketing nav/footer.

**Restyled, logic kept**: `ql-select`, `dataset-selector` (becomes the top bar dataset switcher), `query-builder`, `filter-group`, `filter-condition`, `query-editor`, `transform-panel` (drops its internal collapse), `results-table`, `history-panel`, `diff-panel` (split into controls in the side panel + full-width lists in the Diff tab; the same component can expose two templates or two child components; builder's call), `data-sources-panel` (drops its internal collapse), `settings-page`, `privacy-page`.

**Removed**: the global header and footer markup in `app.component.html` for app-shell routes, `route-pulse` styles, Archivo font files, `AppModeService` and all demo/live UI.

## 12. Quality floor

- Responsive down to 360px. Workspace below 900px: the rail becomes a bottom tab bar (same items, icons + short labels), the side panel becomes a bottom sheet over the results, and the top bar collapses to dataset + Run with the palette trigger as an icon.
- Visible keyboard focus everywhere (2px `--stage-filter` ring with a 2px offset). Full keyboard path: the rail, palette, filter builder, Run and table sort.
- `aria-live="polite"` on the metric row (announces "{returned} rows returned in {ms} ms" after a run), `role="status"` on toasts, proper labels on icon buttons.
- Reduced motion respected (section 5.3).
- Both themes checked on every screen. No hard-coded colors in component CSS, only tokens.
- `npm run test:core` passes. New Vitest specs cover `bento-data.ts` (bucketing across day/week/month ranges, empty input, no date field, breakdown field selection, "Other" grouping) and the share-link URL builder (round trip through `deserialize`).
- `ng build` passes with no new budget warnings. If the landing chunk grows past the budget, the builder can lazy-load the bento.
- Screenshots of landing, workspace (light and dark, desktop and mobile) and settings are taken at the end for review.

## 13. Left to the builder

- Exact component boundaries and file names inside the inventory above.
- The bucketing thresholds and the label formats for the timeline.
- The treemap layout algorithm (squarified, or a simple slice-and-dice for ≤ 6 blocks).
- Whether the active rail item persists in localStorage.
- The exact copy for descriptions and empty states, following the tone here: plain, active, sentence case, no exclamation marks.
- Migration order. Suggested: tokens and fonts → shells and rail → workspace panels → results bento → palette and toasts → landing → settings/privacy → mobile pass → cleanup.
