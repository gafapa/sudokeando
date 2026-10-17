import { useEffect, useRef, useState } from 'react'
import confetti from 'canvas-confetti'
import { AnimatePresence, MotionConfig, useReducedMotion } from 'framer-motion'
import { GameScreen } from './components/GameScreen'
import { HomeScreen } from './components/HomeScreen'
import { parseStoredStats, STORAGE_KEY_STATS, formatTime, createBoard, getSolutionValue, isBoardComplete, markSolutionErrors, isSolvedBoard, getElapsedSeconds } from './lib/game'
import { readPreference, writePreference, updateStats } from './lib/storage'
import type { StatsEvent } from './lib/storage'
import { feedback } from './lib/i18n'
import {
  getTranslation,
  STORAGE_KEY_LANGUAGE,
  STORAGE_KEY_THEME,
} from './lib/i18n'
import {
  getEasyHintComment,
  getFinalErrorComment,
  getFixedCellComment,
  getMascotComment,
} from './lib/mascot'
import { createSudokuForDifficulty } from './lib/sudoku'
import type {
  Difficulty,
  GameStats,
  Language,
  MascotStatus,
  PuzzleCell,
  Screen,
  Theme,
} from './types'

function getInitialLanguage(): Language {
  if (typeof window === 'undefined') {
    return 'es'
  }

  const storedLanguage = readPreference(STORAGE_KEY_LANGUAGE)
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

  const storedTheme = readPreference(STORAGE_KEY_THEME)

  if (storedTheme === 'dark' || storedTheme === 'light') {
    return storedTheme
  }

  return window.matchMedia?.('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
}

export default function App() {
  const [screen, setScreen] = useState<Screen>('home')
  const [difficulty, setDifficulty] = useState<Difficulty>('easy')
  const [board, setBoard] = useState<PuzzleCell[][]>([])
  const [solution, setSolution] = useState('')
  const [selectedCell, setSelectedCell] = useState<[number, number] | null>(null)
  const [timer, setTimer] = useState(0)
  const [gameActive, setGameActive] = useState(false)
  const [stats, setStats] = useState<GameStats>(() => parseStoredStats(readPreference(STORAGE_KEY_STATS)))
  const [storageFailed, setStorageFailed] = useState(false)
  const [generationFailed, setGenerationFailed] = useState(false)
  const startedAt = useRef(0)
  const gameId = useRef<string | null>(null)
  const [language, setLanguage] = useState<Language>(getInitialLanguage)
  const [theme, setTheme] = useState<Theme>(getInitialTheme)
  const [mascotStatus, setMascotStatus] = useState<MascotStatus>('idle')
  const [mascotMessage, setMascotMessage] = useState(() =>
    getMascotComment(language, 'idle'),
  )
  const prefersReducedMotion = useReducedMotion()
  const translation = getTranslation(language)

  useEffect(() => {
    let active = true
    const refresh = () => {
      void updateStats().then((saved) => { if (active) setStats(saved) })
        .catch(() => { if (active) setStorageFailed(true) })
    }
    let channel: BroadcastChannel | null = null
    try {
      if (typeof BroadcastChannel !== 'undefined') channel = new BroadcastChannel('sudokeando_stats')
    } catch { /* Focus refresh remains available if cross-tab messaging is blocked. */ }
    if (channel) channel.onmessage = refresh
    window.addEventListener('focus', refresh)
    window.addEventListener('sudokeando-stats', refresh)
    refresh()
    return () => {
      active = false
      channel?.close()
      window.removeEventListener('focus', refresh)
      window.removeEventListener('sudokeando-stats', refresh)
    }
  }, [])

  useEffect(() => {
    document.documentElement.lang = language
    document.title = translation.appTitle
  }, [language, translation.appTitle])

  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  useEffect(() => {
    if (!gameActive || screen !== 'game') {
      return
    }

    const intervalId = window.setInterval(() => {
      setTimer(getElapsedSeconds(startedAt.current))
    }, 1000)

    return () => window.clearInterval(intervalId)
  }, [gameActive, screen])

  function recordStats(event: StatsEvent) {
    void updateStats(event).then((saved) => {
      setStats(saved)
      window.dispatchEvent(new Event('sudokeando-stats'))
      try {
        if (typeof BroadcastChannel !== 'undefined') {
          const channel = new BroadcastChannel('sudokeando_stats')
          channel.postMessage('changed')
          channel.close()
        }
      } catch { /* Other tabs also refresh their statistics when focused. */ }
    }).catch(() => {
      setStorageFailed(true)
      setStats((current) => {
        const level = current[event.difficulty]
        return { ...current, [event.difficulty]: {
          played: level.played + (event.elapsed === undefined ? 1 : 0),
          won: level.won + (event.elapsed === undefined ? 0 : 1),
          bestTime: event.elapsed === undefined ? level.bestTime : Math.min(level.bestTime ?? event.elapsed, event.elapsed),
        } }
      })
    })
  }

  function startNewGame(nextDifficulty: Difficulty = difficulty) {
    let puzzle
    try { puzzle = createSudokuForDifficulty(nextDifficulty) }
    catch { setGenerationFailed(true); return }
    setGenerationFailed(false)
    startedAt.current = Date.now()
    gameId.current = typeof crypto.randomUUID === 'function' ? crypto.randomUUID() :
      Array.from(crypto.getRandomValues(new Uint8Array(16)), (value) => value.toString(16).padStart(2, '0')).join('')

    setBoard(createBoard(puzzle.puzzle))
    setSolution(puzzle.solution)
    setDifficulty(nextDifficulty)
    setTimer(0)
    setGameActive(true)
    setMascotStatus('idle')
    setMascotMessage(getMascotComment(language, 'idle'))
    setSelectedCell(null)
    setScreen('game')
    recordStats({ gameId: gameId.current, difficulty: nextDifficulty })
  }

  function handleCellClick(rowIndex: number, columnIndex: number) {
    if (!gameActive) {
      return
    }

    const cell = board[rowIndex]?.[columnIndex]
    const correctValue = getSolutionValue(solution, rowIndex, columnIndex)

    setSelectedCell([rowIndex, columnIndex])
    setMascotStatus('thinking')

    if (difficulty === 'easy' && cell && !cell.initial && cell.value === null && correctValue !== null) {
      setMascotMessage(getEasyHintComment(language, rowIndex, columnIndex, correctValue))
      return
    }

    setMascotMessage(
      cell?.initial ? getFixedCellComment(language) : getMascotComment(language, 'thinking'),
    )
  }

  function handleWin() {
    const completedId = gameId.current
    if (!completedId) return
    gameId.current = null
    const elapsed = getElapsedSeconds(startedAt.current)
    setTimer(elapsed)
    setGameActive(false)
    setMascotStatus('win')
    setMascotMessage(getMascotComment(language, 'win'))
    recordStats({ gameId: completedId, difficulty, elapsed })

    if (!prefersReducedMotion) {
      try { confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#2dd4bf', '#8b5cf6', '#f472b6'],
      }) } catch { /* Decorative effects must not interrupt a completed game. */ }
    }

  }

  function handleInput(value: number | null) {
    if (!selectedCell || !gameActive || !gameId.current || (value !== null && (!Number.isInteger(value) || value < 1 || value > 9))) {
      return
    }

    const [rowIndex, columnIndex] = selectedCell
    const cell = board[rowIndex]?.[columnIndex]

    if (!cell || cell.initial) {
      return
    }

    const updatedBoard = board.map((row) => row.map((currentCell) => ({ ...currentCell, error: false })))

    if (value === null) {
      updatedBoard[rowIndex][columnIndex].value = null
      updatedBoard[rowIndex][columnIndex].error = false
      setBoard(updatedBoard)
      setMascotStatus('idle')
      setMascotMessage(getMascotComment(language, 'idle'))
      return
    }

    updatedBoard[rowIndex][columnIndex].value = value
    updatedBoard[rowIndex][columnIndex].error = false

    if (!isBoardComplete(updatedBoard)) {
      setBoard(updatedBoard)
      setMascotStatus('thinking')
      setMascotMessage(getMascotComment(language, 'thinking'))
      return
    }

    if (isSolvedBoard(updatedBoard, solution)) {
      setBoard(updatedBoard)
      handleWin()
      return
    }

    setBoard(markSolutionErrors(updatedBoard, solution))
    setMascotStatus('oops')
    setMascotMessage(getFinalErrorComment(language))
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
    gameId.current = null
    setSelectedCell(null)
    setMascotStatus('idle')
    setMascotMessage(getMascotComment(language, 'idle'))
  }

  function toggleTheme() {
    const nextTheme = theme === 'dark' ? 'light' : 'dark'
    if (!writePreference(STORAGE_KEY_THEME, nextTheme)) setStorageFailed(true)
    setTheme(nextTheme)
  }

  function handleLanguageChange(nextLanguage: Language) {
    if (!writePreference(STORAGE_KEY_LANGUAGE, nextLanguage)) setStorageFailed(true)
    setLanguage(nextLanguage)
    const cell = selectedCell && board[selectedCell[0]]?.[selectedCell[1]]
    if (gameActive && selectedCell && cell && !cell.initial && cell.value === null && difficulty === 'easy') {
      const value = getSolutionValue(solution, ...selectedCell)
      if (value !== null) {
        setMascotMessage(getEasyHintComment(nextLanguage, ...selectedCell, value))
        return
      }
    }
    setMascotMessage(getMascotComment(nextLanguage, mascotStatus))
  }

  return (
    <MotionConfig reducedMotion="user">
    <main className="app-shell">
      {storageFailed && <p className="notice" role="status">{feedback[language].storage}</p>}
      {generationFailed && <p className="notice" role="alert">{feedback[language].generation}</p>}
      <AnimatePresence mode="wait">
        {screen === 'home' ? (
          <HomeScreen
            key="home"
            difficulty={difficulty}
            language={language}
            onDifficultyChange={setDifficulty}
            onLanguageChange={handleLanguageChange}
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
            mascotMessage={mascotMessage}
            mascotStatus={mascotStatus}
            onBack={handleBackToMenu}
            onCellClick={handleCellClick}
            onInput={handleInput}
            onLanguageChange={handleLanguageChange}
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
    </MotionConfig>
  )
}
