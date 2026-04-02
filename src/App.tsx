import { useEffect, useState } from 'react'
import confetti from 'canvas-confetti'
import { AnimatePresence, useReducedMotion } from 'framer-motion'
import { getSudoku } from 'sudoku-gen'
import { GameScreen } from './components/GameScreen'
import { HomeScreen } from './components/HomeScreen'
import {
  DEFAULT_STATS,
  STORAGE_KEY_STATS,
  formatTime,
  getDifficultyLabel,
  parseStoredStats,
} from './lib/game'
import type {
  Difficulty,
  GameStats,
  MascotStatus,
  PuzzleCell,
  Screen,
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
  const prefersReducedMotion = useReducedMotion()

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY_STATS, JSON.stringify(stats))
  }, [stats])

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

  function handleHint() {
    if (!selectedCell || !gameActive) {
      return
    }

    const [rowIndex, columnIndex] = selectedCell
    const cell = board[rowIndex]?.[columnIndex]

    if (!cell || (cell.value !== null && !cell.error)) {
      return
    }

    const correctValue = Number.parseInt(solution[rowIndex * 9 + columnIndex], 10)
    handleInput(correctValue)
  }

  function handleRestart() {
    if (window.confirm('Restart the current game?')) {
      startNewGame()
    }
  }

  function handleBackToMenu() {
    if (gameActive && !window.confirm('Return to the menu? Current progress will be lost.')) {
      return
    }

    setScreen('home')
    setGameActive(false)
    setSelectedCell(null)
    setMascotStatus('idle')
  }

  return (
    <main className="app-container">
      <AnimatePresence mode="wait">
        {screen === 'home' ? (
          <HomeScreen
            key="home"
            difficulty={difficulty}
            onDifficultyChange={setDifficulty}
            onPlay={() => startNewGame(difficulty)}
            formatTime={formatTime}
            getDifficultyLabel={getDifficultyLabel}
            stats={stats}
          />
        ) : (
          <GameScreen
            key="game"
            board={board}
            difficulty={difficulty}
            formatTime={formatTime}
            gameLabel={getDifficultyLabel(difficulty)}
            mascotStatus={mascotStatus}
            onBack={handleBackToMenu}
            onCellClick={handleCellClick}
            onHint={handleHint}
            onInput={handleInput}
            onRestart={handleRestart}
            selectedCell={selectedCell}
            timer={timer}
          />
        )}
      </AnimatePresence>
    </main>
  )
}
