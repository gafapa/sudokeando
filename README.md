# Sudokeando

Sudokeando is a single-page Sudoku game built with React, TypeScript, and Vite. It combines a mobile-friendly board, animated transitions, persistent local stats, and a reactive robot mascot to make Sudoku feel more playful than a standard puzzle app.

![Sudokeando Preview](https://raw.githubusercontent.com/gafapa/sudokeando/main/public/preview.png)

## Features

- Four difficulty levels: `easy`, `medium`, `hard`, and `expert`
- Two-screen flow: home screen and in-game screen
- Reactive SVG mascot with contextual status messages
- Local progress tracking with wins, games played, and best time per difficulty
- Hint, reset, and in-game timer controls
- Victory confetti and animated UI transitions
- PWA setup through `vite-plugin-pwa`

## Tech Stack

- React 19
- TypeScript 5
- Vite 8
- Framer Motion
- Lucide React
- sudoku-gen
- canvas-confetti
- vite-plugin-pwa

## Getting Started

```bash
npm install
npm run dev
```

The local development server runs on `http://localhost:5173` by default.

## Available Scripts

- `npm run dev`: start the Vite development server
- `npm run build`: run TypeScript project build and create a production bundle
- `npm run lint`: run ESLint
- `npm run preview`: preview the production build locally

## Project Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md): current application structure and runtime behavior
- [RULES.md](./RULES.md): repository conventions for code and documentation changes

## Current Limitations

- The entire gameplay flow currently lives in `src/App.tsx`, so domain logic and UI are tightly coupled.
- Several user-facing strings in the application are still in Spanish.
- Some existing text literals in source files show encoding issues and should be normalized to UTF-8 in a future cleanup pass.

## Repository

- Remote: [https://github.com/gafapa/sudokeando](https://github.com/gafapa/sudokeando)
