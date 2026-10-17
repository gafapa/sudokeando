# Sudokeando

A local Sudoku game built with React, TypeScript, and Vite, with four difficulty levels and direct robot hints only on Easy.

## Features

- Validated generated puzzles and final-only correctness checking.
- Keyboard entry, arrow navigation, clearing, and accessible difficulty controls.
- Error descriptions, non-color error marks, and reduced-motion alternatives.
- Spanish, Galician, English, French, German, Portuguese, Catalan, and Basque.
- Light/dark themes with readable primary actions.
- Viewport-sized home and game layouts, a square board sized to available space, and landscape side controls without page scrolling at qualified sizes.
- Transactional statistics, legacy data migration, cross-tab updates, and duplicate-win protection.
- Elapsed-time records that include background time and device sleep.
- PWA build with waiting updates that do not force a reload during play.
- No backend, analytics, external fonts, or runtime AI requests.

## Development

Use Node.js 24 or later:

```sh
npm ci
npm run dev
```

Open `http://localhost:5173/sudokeando/`. Production also uses the `/sudokeando/` base path.

```sh
npm run lint
npm test
npm run build
npm audit --audit-level=low
npm run preview
```

Tests use Node's test runner, tsx, jsdom, and fake-indexeddb. They cover puzzle generation, statistics parsing, migration races, concurrent writes, duplicate receipts, rollback, blocked storage, keyboard entry, and difficulty selection. The pinned GitHub Actions workflow runs these quality checks; local success is separate from hosted CI success.

## Data and recovery

Statistics stay in IndexedDB database `sudokeando`. The existing `sudokeando_stats` localStorage entry is imported once inside a transaction and retained as a migration source. Preferences remain in localStorage. If browser storage is unavailable, playing remains possible and a translated notice explains the persistence limitation.

Active puzzles exist in memory. Reloading or closing loses the current puzzle. Restart creates another puzzle and counts another game. Exiting during play asks for confirmation.

PWA updates wait until all open app tabs/windows close. Chrome viewport checks cover both screens at 320x480, 390x844, 568x320, 768x512, and 1280x720 in all eight languages: 80 combinations without page overflow. These are desktop-browser viewport checks, not physical-device tests. PWA installation and offline startup still require qualification.

## Documentation

- [ARCHITECTURE.md](ARCHITECTURE.md): runtime, transactions, and remaining limits.
- [PROJECT_REVIEW.md](PROJECT_REVIEW.md): original audit and remediation evidence.
- [RULES.md](RULES.md): repository conventions.
