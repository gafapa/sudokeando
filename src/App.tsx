import { useEffect, useState } from 'react'
import confetti from 'canvas-confetti'
import { AnimatePresence, useReducedMotion } from 'framer-motion'
import { getSudoku } from 'sudoku-gen'
import { GameScreen } from './components/GameScreen'
import { HomeScreen } from './components/HomeScreen'
import { DEFAULT_STATS, STORAGE_KEY_STATS, formatTime, parseStoredStats } from './lib/game'
import {
  getTranslation,
  STORAGE_KEY_LANGUAGE,
  STORAGE_KEY_THEME,
} from './lib/i18n'
import type {
  Difficulty,
  GameStats,
  Language,
  MascotStatus,
  PuzzleCell,
  Screen,
  Theme,
} from './types'

function createBoard(puzzle: string): PuzzleCell[][] {
  return Array.from({ length: 9 }, (_, rowIndex) =>
    Array.from({ length: 9 }, (_, columnIndex) => {
      const rawValue = puzzle[rowIndex * 9 + columnIndex]
      const value = rawValue === '-' ? null : Number.parseInt(rawValue, 10)

      return {
        value,
        initial: value !== null,
        error: false,
      }
    }),
  )
}

function getInitialStats(): GameStats {
  if (typeof window === 'undefined') {
    return DEFAULT_STATS
  }

  return parseStoredStats(window.localStorage.getItem(STORAGE_KEY_STATS))
}

function getInitialLanguage(): Language {
  if (typeof window === 'undefined') {
    return 'es'
  }

  const storedLanguage = window.localStorage.getItem(STORAGE_KEY_LANGUAGE)
  return storedLanguage === 'es' ||
    storedLanguage === 'gl' ||
    storedLanguage === 'en' ||
    storedLanguage === 'fr' ||
    storedLanguage === 'de' ||
    storedLanguage === 'pt' ||
    storedLanguage === 'ca' ||
    storedLanguage === 'eu'
    ? storedLanguage
    : 'es'
}

function getInitialTheme(): Theme {
  if (typeof window === 'undefined') {
    return 'dark'
  }

  const storedTheme = window.localStorage.getItem(STORAGE_KEY_THEME)

  if (storedTheme === 'dark' || storedTheme === 'light') {
    return storedTheme
  }

  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
}

export default function App() {
  const [screen, setScreen] = useState<Screen>('home')
  const [difficulty, setDifficulty] = useState<Difficulty>('easy')
  const [board, setBoard] = useState<PuzzleCell[][]>([])
  const [solution, setSolution] = useState('')
  const [selectedCell, setSelectedCell] = useState<[number, number] | null>(null)
  const [timer, setTimer] = useState(0)
  const [gameActive, setGameActive] = useState(false)
  const [stats, setStats] = useState<GameStats>(getInitialStats)
  const [mascotStatus, setMascotStatus] = useState<MascotStatus>('idle')
  const [language, setLanguage] = useState<Language>(getInitialLanguage)
  const [theme, setTheme] = useState<Theme>(getInitialTheme)
  const prefersReducedMotion = useReducedMotion()
  const translation = getTranslation(language)

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY_STATS, JSON.stringify(stats))
  }, [stats])

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY_LANGUAGE, language)
    document.documentElement.lang = language
  }, [language])

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY_THEME, theme)
    document.documentElement.dataset.theme = theme
  }, [theme])

  useEffect(() => {
    if (!gameActive || screen !== 'game') {
      return
    }

    const intervalId = window.setInterval(() => {
      setTimer((currentTimer) => currentTimer + 1)
    }, 1000)

    return () => window.clearInterval(intervalId)
  }, [gameActive, screen])

  function startNewGame(nextDifficulty: Difficulty = difficulty) {
    const puzzle = getSudoku(nextDifficulty)

    setBoard(createBoard(puzzle.puzzle))
    setSolution(puzzle.solution)
    setDifficulty(nextDifficulty)
    setTimer(0)
    setGameActive(true)
    setMascotStatus('idle')
    setSelectedCell(null)
    setScreen('game')
    setStats((currentStats) => ({
      ...currentStats,
      [nextDifficulty]: {
        ...currentStats[nextDifficulty],
        played: currentStats[nextDifficulty].played + 1,
      },
    }))
  }

  function handleCellClick(rowIndex: number, columnIndex: number) {
    if (!gameActive) {
      return
    }

    setSelectedCell([rowIndex, columnIndex])
    setMascotStatus('thinking')
  }

  function handleWin() {
    setGameActive(false)
    setMascotStatus('win')

    if (!prefersReducedMotion) {
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#2dd4bf', '#8b5cf6', '#f472b6'],
      })
    }

    setStats((currentStats) => {
      const currentBestTime = currentStats[difficulty].bestTime

      return {
        ...currentStats,
        [difficulty]: {
          ...currentStats[difficulty],
          won: currentStats[difficulty].won + 1,
          bestTime:
            currentBestTime === null || timer < currentBestTime ? timer : currentBestTime,
        },
      }
    })
  }

  function handleInput(value: number | null) {
    if (!selectedCell || !gameActive) {
      return
    }

    const [rowIndex, columnIndex] = selectedCell
    const cell = board[rowIndex]?.[columnIndex]

    if (!cell || cell.initial) {
      return
    }

    const updatedBoard = board.map((row) => row.map((currentCell) => ({ ...currentCell })))

    if (value === null) {
      updatedBoard[rowIndex][columnIndex].value = null
      updatedBoard[rowIndex][columnIndex].error = false
      setBoard(updatedBoard)
      setMascotStatus('idle')
      return
    }

    const correctValue = Number.parseInt(solution[rowIndex * 9 + columnIndex], 10)
    const isError = value !== correctValue

    updatedBoard[rowIndex][columnIndex].value = value
    updatedBoard[rowIndex][columnIndex].error = isError

    setBoard(updatedBoard)
    setMascotStatus(isError ? 'oops' : 'happy')

    const isWin = updatedBoard.every((row, currentRowIndex) =>
      row.every(
        (currentCell, currentColumnIndex) =>
          currentCell.value ===
          Number.parseInt(solution[currentRowIndex * 9 + currentColumnIndex], 10),
      ),
    )

    if (isWin) {
      handleWin()
    }
  }

  function handleRestart() {
    if (window.confirm(translation.restartConfirm)) {
      startNewGame()
    }
  }

  function handleBackToMenu() {
    if (gameActive && !window.confirm(translation.leaveConfirm)) {
      return
    }

    setScreen('home')
    setGameActive(false)
    setSelectedCell(null)
    setMascotStatus('idle')
  }

  function toggleTheme() {
    setTheme((currentTheme) => (currentTheme === 'dark' ? 'light' : 'dark'))
  }

  return (
    <main className="app-shell">
      <AnimatePresence mode="wait">
        {screen === 'home' ? (
          <HomeScreen
            key="home"
            difficulty={difficulty}
            language={language}
            onDifficultyChange={setDifficulty}
            onLanguageChange={setLanguage}
            onPlay={() => startNewGame(difficulty)}
            onThemeToggle={toggleTheme}
            stats={stats}
            theme={theme}
            translation={translation}
          />
        ) : (
          <GameScreen
            key="game"
            board={board}
            difficulty={difficulty}
            formatTime={formatTime}
            language={language}
            mascotStatus={mascotStatus}
            onBack={handleBackToMenu}
            onCellClick={handleCellClick}
            onInput={handleInput}
            onLanguageChange={setLanguage}
            onRestart={handleRestart}
            onThemeToggle={toggleTheme}
            selectedCell={selectedCell}
            theme={theme}
            timer={timer}
            translation={translation}
          />
        )}
      </AnimatePresence>
    </main>
  )
}
