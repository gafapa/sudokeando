# Architecture

## Runtime modules

Sudokeando runs entirely in the browser, with no backend or player-data transmission. Vite serves it under `/sudokeando/` using local assets and system fonts.

- `src/App.tsx`: screens, lifecycle, timing, preferences, and statistics integration.
- `src/lib/game.ts`: pure board transformations, validation, legacy parsing, and time formatting.
- `src/lib/sudoku.ts`: generation plus structural, clue, and solution checks.
- `src/lib/storage.ts`: guarded preferences and transactional statistics.
- `src/lib/i18n.ts`: typed translations and recovery/error/hint copy.
- `src/lib/mascot.ts`: randomized Spanish/English commentary and native-language fallbacks for other locales.
- `src/components/`: home, gameplay, and SVG mascot.
- `src/index.css`: theme tokens, responsive layouts, focus, and error treatments.
- `tests/`: domain, storage, and React interaction regressions.

## Gameplay

Starting validates a puzzle, creates its board, assigns a cryptographically random game ID, captures a start timestamp, and records the start. Fixed clues cannot be edited. Only Easy exposes solution values through empty-cell hints. Correctness is checked when the board is filled. Editing clears previous final-check error marks. Invalid cells expose textual/programmatic errors and wavy underlines.

A synchronous game ID guard stops duplicate completion handling. Winning records its result independently of decorative effects. The timer derives elapsed seconds from timestamps, including background time and sleep; the interval only refreshes its display. Completion recalculates the final result. Wall-clock adjustments can affect timing; negative elapsed values are clamped.

## Atomic statistics

IndexedDB database `sudokeando`, schema version 1, has two stores:

- `stats`: aggregate under key `current`.
- `games`: receipts keyed by game ID, storing difficulty and whether a win was counted.

Every event uses a readwrite transaction over both stores. The first transaction imports validated legacy `sudokeando_stats` if no aggregate exists. IndexedDB serializes overlapping transactions across tabs, preventing migration races and lost increments. Each ID adds played/won counts at most once. A win arriving before its start counts both once. Reusing an ID for another difficulty aborts. Promises resolve only after commit.

The legacy localStorage key is retained without rewriting. BroadcastChannel sends change notifications only; tabs reread their local database. Same-window events and focus refresh also update totals. Messaging failure cannot turn a committed result into a duplicate fallback increment.

Storage failure leaves the game playable in memory with a localized notice. Unsaved fallback totals are not automatically reconciled after later recovery. Receipts are retained for idempotency and grow with games played.

## Preferences and accessibility

Preference access catches storage exceptions. Language, title, and theme still follow React state when preferences cannot persist. Locale changes immediately regenerate the mascot message. Theme labels describe the destination mode.

The grid has one tab stop and focus-driven selection. Arrows/Home/End navigate; digits enter values; Delete/Backspace/0 clear. Modified browser shortcuts are preserved. Difficulty radios support roving focus and arrows/Home/End. Errors use programmatic and non-color cues. CSS float, Framer Motion keyframes, screen movement, and confetti respect reduced-motion preferences.

## Delivery

The build runs TypeScript, Vite, and PWA worker generation. Downloaded updates wait for app tabs/windows to close instead of forcing activation during gameplay.

The verification workflow pins action SHAs, limits permissions to read-only contents, disables checkout credential persistence, cancels superseded runs, and bounds job duration. It installs from the lockfile, lints, tests, builds, and audits dependencies.

## Remaining limits

- Active puzzles are not persisted across reloads.
- Restart/exit use native confirmation dialogs.
- Browser policy/quota governs persistence; failure is visible.
- Simulated DOM/storage tests do not certify real-device rendering, performance, WCAG conformance, PWA installation, or offline recovery.
