import type { Difficulty, GameStats } from '../types'

export const STORAGE_KEY_STATS = 'sudokeando_stats'

export const DEFAULT_STATS: GameStats = {
  easy: { played: 0, won: 0, bestTime: null },
  medium: { played: 0, won: 0, bestTime: null },
  hard: { played: 0, won: 0, bestTime: null },
  expert: { played: 0, won: 0, bestTime: null },
}

const difficultyLabels: Record<Difficulty, string> = {
  easy: 'Relaxed',
  medium: 'Challenging',
  hard: 'Advanced',
  expert: 'Legendary',
}

function isValidDifficultyStats(value: unknown): value is GameStats[keyof GameStats] {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const candidate = value as Partial<GameStats[keyof GameStats]>

  return (
    typeof candidate.played === 'number' &&
    typeof candidate.won === 'number' &&
    (candidate.bestTime === null || typeof candidate.bestTime === 'number')
  )
}

export function parseStoredStats(rawStats: string | null): GameStats {
  if (!rawStats) {
    return DEFAULT_STATS
  }

  try {
    const parsedStats = JSON.parse(rawStats) as Partial<GameStats>

    if (
      isValidDifficultyStats(parsedStats.easy) &&
      isValidDifficultyStats(parsedStats.medium) &&
      isValidDifficultyStats(parsedStats.hard) &&
      isValidDifficultyStats(parsedStats.expert)
    ) {
      return parsedStats as GameStats
    }
  } catch {
    return DEFAULT_STATS
  }

  return DEFAULT_STATS
}

export function formatTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60

  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`
}

export function getDifficultyLabel(difficulty: Difficulty): string {
  return difficultyLabels[difficulty]
}
