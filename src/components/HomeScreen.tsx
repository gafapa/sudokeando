import { motion } from 'framer-motion'
import { Play, Trophy } from 'lucide-react'
import { Mascot } from './Mascot'
import type { Difficulty, GameStats } from '../types'

interface HomeScreenProps {
  difficulty: Difficulty
  onDifficultyChange: (difficulty: Difficulty) => void
  onPlay: () => void
  formatTime: (seconds: number) => string
  getDifficultyLabel: (difficulty: Difficulty) => string
  stats: GameStats
}

const levels: Difficulty[] = ['easy', 'medium', 'hard', 'expert']

export function HomeScreen({
  difficulty,
  onDifficultyChange,
  onPlay,
  formatTime,
  getDifficultyLabel,
  stats,
}: HomeScreenProps) {
  return (
    <motion.section
      className="home-screen"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
    >
      <h1>Sudokeando</h1>
      <p className="home-subtitle">Train your focus with style.</p>

      <Mascot status="idle" className="mascot-large" />

      <div className="difficulty-grid" role="radiogroup" aria-label="Select puzzle difficulty">
        {levels.map((level) => (
          <button
            key={level}
            type="button"
            className={`glass diff-card ${difficulty === level ? 'selected' : ''}`}
            onClick={() => onDifficultyChange(level)}
            role="radio"
            aria-checked={difficulty === level}
          >
            <h2>{level}</h2>
            <p>{getDifficultyLabel(level)}</p>
          </button>
        ))}
      </div>

      <button type="button" className="action-btn btn-primary play-btn" onClick={onPlay}>
        <Play size={24} fill="currentColor" /> Play
      </button>

      <section className="stats-container" aria-labelledby="stats-heading">
        <h2 id="stats-heading" className="stats-heading">
          <Trophy size={20} color="gold" /> Progress
        </h2>
        {levels.map((level) => (
          <article key={level} className="stat-item glass">
            <div className="stat-info">
              <h3>{level}</h3>
              <p className="stat-copy">{stats[level].won} wins</p>
            </div>
            <div className="stat-val">
              <div className="stat-strong">{stats[level].played} games</div>
              <div className="stat-copy">
                Best: {stats[level].bestTime === null ? '--:--' : formatTime(stats[level].bestTime)}
              </div>
            </div>
          </article>
        ))}
      </section>
    </motion.section>
  )
}
