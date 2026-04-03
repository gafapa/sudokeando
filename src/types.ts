export type Difficulty = 'easy' | 'medium' | 'hard' | 'expert'

export type Screen = 'home' | 'game'

export type MascotStatus = 'idle' | 'happy' | 'thinking' | 'oops' | 'win'

export type Theme = 'dark' | 'light'

export type Language = 'es' | 'gl' | 'en' | 'fr' | 'de' | 'pt' | 'ca' | 'eu'

export interface DifficultyStats {
  played: number
  won: number
  bestTime: number | null
}

export interface GameStats {
  easy: DifficultyStats
  medium: DifficultyStats
  hard: DifficultyStats
  expert: DifficultyStats
}

export interface PuzzleCell {
  value: number | null
  initial: boolean
  error: boolean
}
