import { motion } from 'framer-motion'
import { Globe, Moon, Play, Sun, Trophy } from 'lucide-react'
import { formatTime } from '../lib/game'
import { Mascot } from './Mascot'
import { SUPPORTED_LANGUAGES, translations } from '../lib/i18n'
import type { Difficulty, GameStats, Language, Theme } from '../types'

type TranslationSet = (typeof translations)[Language]

interface HomeScreenProps {
  difficulty: Difficulty
  language: Language
  onDifficultyChange: (difficulty: Difficulty) => void
  onLanguageChange: (language: Language) => void
  onPlay: () => void
  onThemeToggle: () => void
  stats: GameStats
  theme: Theme
  translation: TranslationSet
}

const levels: Difficulty[] = ['easy', 'medium', 'hard', 'expert']

export function HomeScreen({
  difficulty,
  language,
  onDifficultyChange,
  onLanguageChange,
  onPlay,
  onThemeToggle,
  stats,
  theme,
  translation,
}: HomeScreenProps) {
  return (
    <motion.section
      className="home-screen home-stage"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="home-controls glass">
        <label className="selector-group">
          <div className="selector-field">
            <Globe size={16} />
            <select
              value={language}
              onChange={(event) => onLanguageChange(event.target.value as Language)}
              aria-label={translation.language}
            >
              {SUPPORTED_LANGUAGES.map((languageCode) => (
                <option key={languageCode} value={languageCode}>
                  {translations[languageCode].languageName}
                </option>
              ))}
            </select>
          </div>
        </label>

        <button
          type="button"
          className="theme-toggle"
          onClick={onThemeToggle}
          aria-label={translation.modeLabel[theme === 'dark' ? 'light' : 'dark']}
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          <span>{theme === 'dark' ? translation.lightMode : translation.darkMode}</span>
        </button>
      </div>

      <div className="home-hero">
        <div className="hero-copy">
          <h1>{translation.homeTitle}</h1>

          <div className="hero-actions">
            <button type="button" className="action-btn btn-primary play-btn" onClick={onPlay}>
              <Play size={24} fill="currentColor" /> {translation.play}
            </button>
          </div>
        </div>

        <div className="hero-side">
          <div className="mascot-panel glass">
            <Mascot status="idle" className="mascot-large" message={translation.mascotMessages.idle} />
            <div className="robot-note">
              <strong>{translation.noHints}</strong>
            </div>
          </div>
        </div>
      </div>

      <section className="difficulty-section">
        <div className="section-heading">
          <h2>{translation.difficultyLabel}</h2>
        </div>
        <div className="difficulty-grid" role="radiogroup" aria-label={translation.difficultyLabel}>
          {levels.map((level) => (
            <button
              key={level}
              type="button"
              className={`glass diff-card ${difficulty === level ? 'selected' : ''}`}
              onClick={() => onDifficultyChange(level)}
              tabIndex={difficulty === level ? 0 : -1}
              onKeyDown={(event) => {
                const offset = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key]
                if (offset === undefined && event.key !== 'Home' && event.key !== 'End') return
                event.preventDefault()
                const index = event.key === 'Home' ? 0 : event.key === 'End' ? levels.length - 1 : (levels.indexOf(level) + (offset ?? 0) + levels.length) % levels.length
                onDifficultyChange(levels[index])
                event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('[role="radio"]')[index]?.focus()
              }}
              role="radio"
              aria-checked={difficulty === level}
            >
              <h2>{translation.difficultyNames[level]}</h2>
            </button>
          ))}
        </div>
      </section>

      <section className="stats-container" aria-labelledby="stats-heading">
        <h2 id="stats-heading" className="stats-heading">
          <Trophy size={18} /> {translation.progress} <span className="stats-level">{translation.difficultyNames[difficulty]}</span>
        </h2>
        <div className="stats-summary" aria-label={translation.difficultyNames[difficulty]}>
          <div className="stat-metric"><strong>{stats[difficulty].won}</strong><span>{translation.wins}</span></div>
          <div className="stat-metric"><strong>{stats[difficulty].played}</strong><span>{translation.games}</span></div>
          <div className="stat-metric"><strong>{stats[difficulty].bestTime === null ? '--:--' : formatTime(stats[difficulty].bestTime)}</strong><span>{translation.best}</span></div>
        </div>
      </section>
    </motion.section>
  )
}
