# Architecture

## Overview

Sudokeando is a client-side React application with a single entry point and no backend services. The app runs entirely in the browser and persists lightweight player statistics in `localStorage`.

## Runtime Structure

- `src/main.tsx`: bootstraps React and mounts the root application.
- `src/App.tsx`: coordinates screen state, game lifecycle, puzzle generation, timer, persistence, and top-level handlers.
- `src/components/Mascot.tsx`: renders the animated robot mascot and live status message.
- `src/components/HomeScreen.tsx`: renders difficulty selection and progress summary.
- `src/components/GameScreen.tsx`: renders the Sudoku board, number pad, timer, and in-game actions.
- `src/lib/game.ts`: stores default stats, localStorage parsing, time formatting, and difficulty labels.
- `src/lib/i18n.ts`: stores translated copy, supported languages, and theme/language storage keys.
- `src/types.ts`: shared application types for stats, board cells, difficulty, and screen state.
- `src/index.css`: defines the visual system, layout, responsive behavior, and component styling.
- `public/`: static assets exposed by Vite.
- `vite.config.ts`: Vite configuration plus Progressive Web App registration and manifest metadata.

## Application Flow

The app has two screens:

1. `home`
2. `game`

The root component stores the active screen in React state and switches views with `AnimatePresence` from Framer Motion.

## State Model

`src/App.tsx` manages runtime state with React hooks:

- `screen`: current view (`home` or `game`)
- `difficulty`: selected Sudoku difficulty
- `board`: 9x9 matrix of puzzle cells
- `solution`: flattened solution string returned by `sudoku-gen`
- `selectedCell`: currently active board cell
- `timer`: elapsed seconds for the current game
- `gameActive`: whether input and timer are enabled
- `stats`: aggregate local stats by difficulty
- `mascotStatus`: mascot animation and message state
- `language`: active UI locale
- `theme`: active color theme (`dark` or `light`)

## Sudoku Data Flow

When a new game starts:

1. `getSudoku(difficulty)` generates a puzzle and its solution.
2. The puzzle string is converted into a 9x9 `board` matrix.
3. Each cell is represented as `{ value, initial, error }`.
4. The matching `solution` string is stored for validation.
5. The selected difficulty's `played` counter is incremented.

When the player enters a value:

1. The selected cell is validated against the stored solution.
2. The cell is marked with `error` when the value is wrong.
3. The mascot status changes to `happy` or `oops`.
4. The board is scanned for completion.
5. On success, the app stops the timer, triggers confetti, and updates best-time statistics.

## Persistence

- Storage mechanism: browser `localStorage`
- Storage key: `sudokeando_stats`
- Additional keys: `sudokeando_language`, `sudokeando_theme`
- Saved data: played count, won count, and best time for each difficulty
- Parsing strategy: validated through `parseStoredStats()` before hydrating React state

No other client persistence layer exists.

## UI Composition

The UI is now split into focused modules:

- `Mascot`: animated SVG robot and speech bubble
- `HomeScreen`: redesigned landing page, theme/language controls, difficulty selection, and progress summary
- `GameScreen`: board, keypad, timer, navigation, and compact theme/language controls
- `App`: orchestration, state ownership, and integration logic

Interactive controls use semantic buttons, visible focus states, and status announcements for basic accessibility support.
Theme selection is applied through `document.documentElement.dataset.theme`, and translated copy is resolved from a local dictionary layer.

## External Dependencies

- `react` and `react-dom`: rendering and state management
- `framer-motion`: screen and mascot animations
- `sudoku-gen`: puzzle and solution generation
- `lucide-react`: icons
- `canvas-confetti`: win animation
- `vite-plugin-pwa`: service worker registration and manifest generation

## Build and Delivery

- Bundler: Vite
- Language: TypeScript
- Linting: ESLint
- Package manager lockfile: `package-lock.json`
- Output directory: `dist/`

## Known Technical Debt

- Restart and exit flows still depend on blocking `window.confirm()` dialogs.
- Board navigation is click-based; there is no arrow-key movement model for Sudoku cells yet.
- Game rules and board transformations are still embedded in the React layer rather than a pure game engine module.
