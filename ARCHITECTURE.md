# Architecture

## Overview

Sudokeando is a client-side React application with a single entry point and no backend services. The app runs entirely in the browser and persists lightweight player statistics in `localStorage`.

## Runtime Structure

- `src/main.tsx`: bootstraps React and mounts the root application.
- `src/App.tsx`: contains the full application flow, state management, game logic, mascot rendering, and screen components.
- `src/index.css`: defines the visual system, layout, responsive behavior, and component styling.
- `public/`: static assets exposed by Vite.
- `vite.config.ts`: Vite configuration plus Progressive Web App registration and manifest metadata.

## Application Flow

The app has two screens:

1. `home`
2. `game`

The root component stores the active screen in React state and switches views with `AnimatePresence` from Framer Motion.

## State Model

`src/App.tsx` manages all runtime state with React hooks:

- `screen`: current view (`home` or `game`)
- `difficulty`: selected Sudoku difficulty
- `board`: 9x9 matrix of puzzle cells
- `solution`: flattened solution string returned by `sudoku-gen`
- `selectedCell`: currently active board cell
- `timer`: elapsed seconds for the current game
- `gameActive`: whether input and timer are enabled
- `stats`: aggregate local stats by difficulty
- `mascotStatus`: mascot animation and message state

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
- Saved data: played count, won count, and best time for each difficulty

No other client persistence layer exists.

## UI Composition

The UI is currently implemented in a monolithic file:

- `Mascot`: animated SVG robot and speech bubble
- `HomeScreen`: difficulty selection, play action, and stats summary
- `GameScreen`: board, keypad, timer, navigation, and helper actions

This works for the current size of the project, but it is the main architectural hotspot for future refactoring.

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

- Gameplay logic, UI state, and presentational components are not separated into modules.
- The project mixes English identifiers with Spanish UI copy.
- Some strings in the current source appear with broken encoding and should be normalized.
- The PWA manifest references icon files that should be verified against the contents of `public/`.
