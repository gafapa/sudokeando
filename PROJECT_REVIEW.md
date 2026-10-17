# Project Review

Date: 2026-10-17

## Remediation update

A subsequent graphics pass introduced local Nunito Sans typography, alternating block shading, larger tabular numerals, distinct player-entry colors, clearer selection, soft control elevation, and difficulty indicators. Local lint, all 20 regressions, and the complete PWA build pass. Gameplay was measured at 320x480, 568x320, and 1280x720 in both themes without page overflow. Calculated contrast is 5.47:1 for selected-cell text, 4.73:1 for light-theme entries on related cells, and 6.00:1 for dark-theme entries on matching-value cells. Both WOFF2 assets and their license are present in the generated precache. Current screenshots include both themes.

Follow-up interface work recovered Chrome access and qualified viewport-fitting layouts. Both screens passed 80 viewport/locale combinations (five sizes, eight languages, two screens) with no page overflow. Home hero content also remained within its allocated row after fixing a small-screen overlap. The game keeps a square board and switches between bottom and side controls. Selected-difficulty statistics replace four repeated panels; restart moved into the toolbar. Browser screenshots are available in `docs/screenshots/`. Physical-device/PWA qualification remains separate. This evidence supersedes the browser-timeout limitation recorded below.

The findings below describe the original audit. Subsequent remediation updated the dependency graph (including Vite 8.3.4, React 19.3.1, and ESLint 10.13.0), moved statistics into atomic IndexedDB transactions with idempotent receipts, guarded preference storage, and added a visible persistence-failure notice. The legacy statistics key is migrated once and retained.

Keyboard focus/entry, difficulty radio navigation, primary-action and keypad-hover contrast, accessible/non-color errors, all-locale hint/error copy, immediate locale changes, reduced-motion behavior, and elapsed-time measurement have been corrected. Board transformations now live in a domain module and generated solutions are validated. PWA updates wait instead of forcing activation during gameplay.

Regression tests and a pinned GitHub Actions verification workflow have been added. Local ESLint passes, 20 tests pass (19 domain/storage/React interaction cases plus the all-locale regression), and the complete TypeScript/Vite/PWA build passes. The latest npm audit reports zero vulnerabilities. The generated JavaScript is approximately 422 kB / 136 kB gzip. Browser automation still times out, so actual desktop/mobile appearance, PWA installation, and offline recovery remain unqualified. Active-puzzle recovery after reload remains a documented product limitation.

## Scope and conclusion

Reviewed the current working tree, including existing uncommitted changes. The application has a coherent Sudoku-specific interface, a compact component structure, typed translations, and validated statistics parsing. Reliability, accessibility, and dependency security need attention before release. No application code was changed during this review.

Browser automation could enumerate Chrome but timed out opening the local application. Findings below are based on source inspection, command output, and targeted executable checks. Desktop/mobile rendering, installation, offline recovery, and complete gameplay were not verified in a browser.

## Verification

- `npm run lint`: passed.
- TypeScript compilation: passed as part of the production build.
- `npm run build`: passed, including TypeScript, the Vite client bundle, and PWA service-worker generation. Approximately 383 kB JavaScript / 124 kB gzip; seven precache entries. Browserslist reported that its compatibility database is seven months old.
- Generated 25 puzzles per difficulty, 100 total: all puzzle/solution strings had valid lengths and characters, all clues matched their solutions, and every solution row, column, and box contained nine distinct digits. This check does not establish puzzle uniqueness or difficulty quality.
- `npm audit --json`: 11 affected dependency entries: 8 high, 2 moderate, 1 low; no critical entries. npm reported fixes available for every entry. Counts describe affected packages, not independently exploitable browser vulnerabilities.
- Impeccable mechanical detector: no findings for the reviewed application/component/CSS targets. Manual inspection still found defects.
- `git diff --check`: no whitespace errors; existing CRLF normalization warnings remain.
- No test script or repository CI workflow is present.

## Findings, ordered by priority

### P1: Vulnerable development and build dependencies

Location: `package.json:34`, `package-lock.json`.

The installed Vite 8.0.12 is affected by a Windows file-access restriction bypass. The upstream advisory describes exposure when the development server is accessible over the network and sensitive files exist in allowed directories. The review server was bound to loopback. Other audit entries concern transitive tooling, including PostCSS, js-yaml, brace-expansion, and source-map-js. These findings do not prove that the static deployed game is remotely exploitable.

Update the affected dependency graph and lockfile, then rerun audit, lint, production build, and gameplay checks. The specific Vite issue was patched in 8.0.16; select a maintained version after checking current compatibility.

Source: [Vite Windows advisory](https://github.com/advisories/GHSA-fx2h-pf6j-xcff).

### P1: Storage exceptions can prevent the application from loading

Location: `src/App.tsx:77`, `85`, `103`, `131`.

All localStorage reads and writes are unguarded. A browser policy denying storage can throw during state initialization; write failures can interrupt effects. JSON parsing validation does not protect storage access itself.

Introduce a storage adapter that catches access/write failures, keeps the game playable in memory, and makes failure to save visible to the player.

### P1: Independent tabs overwrite statistics

Location: `src/App.tsx:119`, `131`, `170`, `213`.

Each tab holds its own statistics snapshot and writes the entire object. There is no synchronization, transaction, revision check, or storage-event handling. If two tabs start from the same totals, increments in one can replace increments and records from the other. An older tab can also reset unrelated difficulty totals when it writes its stale snapshot.

Apply increments and best-time updates transactionally, for example through IndexedDB, or serialize read-modify-write operations using Web Locks. Merely listening for storage events does not guarantee atomic updates.

### P1: Light-theme primary actions fail normal-text contrast

Location: `src/index.css:27`, `530`; `src/components/HomeScreen.tsx:80`; `src/components/GameScreen.tsx:227`.

The primary background becomes `#0f766e`, while the label remains `#06201d`. The calculated contrast is approximately 3.11:1. Play and Restart use normal-sized text, below the 4.5:1 WCAG AA requirement. Use a foreground token chosen for each theme and verify normal, hover, and focus states.

### P2: Tab focus does not initialize the selected Sudoku cell

Location: `src/components/GameScreen.tsx:81`, `185`, `191`; `src/App.tsx:229`.

At game start, the first cell is tabbable while selectedCell is null. Focus does not call the selection handler. Pressing a digit or Delete after entering the board with Tab therefore does nothing until the player clicks, activates a cell, or uses an arrow key. Synchronize focus and selection, or pass the focused cell coordinates into keyboard input handling. Also implement expected arrow-key behavior for the difficulty radiogroup in `HomeScreen.tsx:108`.

### P2: Error feedback depends on color and its text style is overridden

Location: `src/index.css:471`, `473`; `src/components/GameScreen.tsx:188`.

The later `.cell.user-input` rule overrides the red text declared by `.cell.error`, leaving background color as the per-cell error cue. Cells expose neither aria-invalid nor a textual per-cell error description. The mascot gives only a generic final-error message. Preserve a distinct error treatment and expose the invalid state programmatically, with a non-color visual cue.

### P2: Six locales contradict Easy-mode hints

Location: `src/lib/i18n.ts:126`, `236`, `291`, `346`, `401`, `456`; `src/lib/mascot.ts:104`, `119`, `132`; `src/App.tsx:124`.

Galician, French, German, Portuguese, Catalan, and Basque tell players the robot no longer provides hints, but Easy mode reveals solution values. Hint, fixed-cell, and final-error templates only support Spanish and English, so other locales fall back to English. Changing language during a game also leaves the current mascot message in the previous language until another action changes it.

Translate all message categories, align the rules copy with Easy-only hints, and regenerate the current message when the selected language changes.

### P2: Reduced-motion preference does not cover Framer Motion animations

Location: `src/components/Mascot.tsx:178`, `188`, `197`; `src/index.css:615`; screen transition props in both screen components.

The CSS media query disables the robot's CSS float, and App disables confetti, but infinite SVG radius/opacity/rotation animations and screen translations remain configured in Framer Motion. Apply a motion policy and explicit static alternatives for repeating keyframes.

### P2: Timer counts callbacks rather than elapsed time

Location: `src/App.tsx:145`.

The timer adds one second per setInterval callback. Background throttling, device sleep, blocked dialogs, and long main-thread tasks can make the displayed time and recorded best time diverge from elapsed time. Define whether time should include background periods, then derive it from timestamps with explicit pause/resume behavior.

## Product limitations and documentation

- Active puzzles exist only in React state. Reloading or closing the page loses the current puzzle. Decide whether resumable games are part of the product, especially for the PWA.
- README's remaining-limitation text says puzzle generation has no dedicated domain module, but `src/lib/sudoku.ts` now wraps generation. Update that description precisely.
- README uses a root development URL although Vite has a `/sudokeando/` base path. Document the actual path.
- The theme toggle's accessible name describes the current mode while its icon/text describes the destination mode. Use an action label or an explicit toggle state.

## Provisional interface health

These are code-level assessments, not visual or WCAG certification. Responsive behavior needs browser verification before scoring.

| Dimension | Score | Evidence |
| --- | --- | --- |
| Accessibility | 2/4 | Semantic controls and grid navigation exist; contrast, initial keyboard selection, error semantics, and motion have gaps. |
| Performance | 3/4 | Small local puzzle-generation costs in sampled checks; production JS is about 124 kB gzip; runtime performance remains unmeasured. |
| Responsive design | Not scored | Breakpoints exist, but desktop/mobile rendering was not verified. |
| Theming | 2/4 | Shared theme tokens exist, but primary-action foreground does not adapt correctly. |
| Implementation integrity | 3/4 | Coherent product structure; translated rules and message coverage disagree with behavior. |

No overall score is assigned because responsive verification is incomplete. There are 4 P1 and 5 P2 findings above, with no confirmed P0 blocker under normal storage conditions.

## Recommended sequence

1. Update vulnerable dependencies and verify the complete build.
2. Harden storage access and make statistics updates atomic.
3. Use `$impeccable harden` for keyboard input, accessible error feedback, theme labels, and locale consistency.
4. Use `$impeccable colorize` for verified light-theme contrast and `$impeccable animate` for reduced-motion behavior.
5. Add focused regression coverage for concurrent statistics, storage failure, initial keyboard entry, and win accounting; define timer semantics.
6. Verify desktop/mobile layout, keyboard gameplay, PWA installation, offline startup, and update behavior in a browser.
7. Finish with `$impeccable polish` after functional fixes. These interface passes can be requested separately or together; rerun `$impeccable audit` after fixes.
