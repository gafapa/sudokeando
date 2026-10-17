import type { Difficulty, GameStats, PuzzleCell } from '../types'

export const STORAGE_KEY_STATS = 'sudokeando_stats'

export function createDefaultStats(): GameStats {
  return {
    easy: { played: 0, won: 0, bestTime: null },
    medium: { played: 0, won: 0, bestTime: null },
    hard: { played: 0, won: 0, bestTime: null },
    expert: { played: 0, won: 0, bestTime: null },
  }
}

export const DEFAULT_STATS: GameStats = createDefaultStats()

const difficulties: Difficulty[] = ['easy', 'medium', 'hard', 'expert']

const difficultyLabels: Record<Difficulty, string> = {
  easy: 'Relaxed',
  medium: 'Challenging',
  hard: 'Advanced',
  expert: 'Legendary',
}

function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0
}

function isValidDifficultyStats(value: unknown): value is GameStats[keyof GameStats] {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const candidate = value as Partial<GameStats[keyof GameStats]>
  const bestTimeIsValid =
    candidate.bestTime === null || isNonNegativeInteger(candidate.bestTime)

  return (
    isNonNegativeInteger(candidate.played) &&
    isNonNegativeInteger(candidate.won) &&
    candidate.won <= candidate.played &&
    bestTimeIsValid
  )
}

function cloneStats(stats: GameStats): GameStats {
  return {
    easy: { ...stats.easy },
    medium: { ...stats.medium },
    hard: { ...stats.hard },
    expert: { ...stats.expert },
  }
}

export function parseStoredStats(rawStats: string | null): GameStats {
  if (!rawStats) {
    return createDefaultStats()
  }

  try {
    const parsedStats = JSON.parse(rawStats) as Partial<GameStats>

    if (difficulties.every((difficulty) => isValidDifficultyStats(parsedStats[difficulty]))) {
      return cloneStats(parsedStats as GameStats)
    }
  } catch {
    return createDefaultStats()
  }

  return createDefaultStats()
}

export function formatTime(totalSeconds: number): string {
  const safeTotalSeconds = isNonNegativeInteger(totalSeconds) ? totalSeconds : 0
  const minutes = Math.floor(safeTotalSeconds / 60)
  const seconds = safeTotalSeconds % 60

  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`
}

export function getElapsedSeconds(startedAt: number, now: number = Date.now()): number {
  return Math.max(0, Math.floor((now - startedAt) / 1000))
}

export function getDifficultyLabel(difficulty: Difficulty): string {
  return difficultyLabels[difficulty]
}

export function createBoard(puzzle: string): PuzzleCell[][] {
  if (!/^[1-9-]{81}$/.test(puzzle)) throw new Error('Invalid puzzle')
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

export function getSolutionValue(solution: string, rowIndex: number, columnIndex: number): number | null {
  const value = Number.parseInt(solution[rowIndex * 9 + columnIndex], 10)
  return Number.isNaN(value) ? null : value
}

export function isBoardComplete(board: PuzzleCell[][]): boolean {
  return board.length === 9 && board.every((row) => row.length === 9 && row.every((cell) =>
    cell.value !== null && Number.isInteger(cell.value) && cell.value >= 1 && cell.value <= 9))
}

export function markSolutionErrors(board: PuzzleCell[][], solution: string): PuzzleCell[][] {
  return board.map((row, rowIndex) =>
    row.map((cell, columnIndex) => {
      const correctValue = getSolutionValue(solution, rowIndex, columnIndex)

      return {
        ...cell,
        error: !cell.initial && correctValue !== null && cell.value !== correctValue,
      }
    }),
  )
}

export function isSolvedBoard(board: PuzzleCell[][], solution: string): boolean {
  return /^[1-9]{81}$/.test(solution) && isBoardComplete(board) && board.every((row, rowIndex) =>
    row.every((cell, columnIndex) => cell.value === getSolutionValue(solution, rowIndex, columnIndex)),
  )
}
