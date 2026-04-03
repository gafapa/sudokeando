import { motion } from 'framer-motion'
import { Globe, Moon, Play, Sparkles, Sun, Trophy } from 'lucide-react'
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
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -24 }}
    >
      <div className="home-controls glass">
        <label className="selector-group">
          <span>{translation.language}</span>
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
          aria-label={translation.modeLabel[theme]}
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          <span>{theme === 'dark' ? translation.lightMode : translation.darkMode}</span>
        </button>
      </div>

      <div className="home-hero">
        <div className="hero-copy">
          <div className="eyebrow">
            <Sparkles size={16} />
            <span>{translation.appTitle}</span>
          </div>
          <h1>{translation.homeTitle}</h1>
          <p className="home-subtitle">{translation.homeSubtitle}</p>
          <p className="home-description">{translation.homeDescription}</p>

          <div className="hero-actions">
            <button type="button" className="action-btn btn-primary play-btn" onClick={onPlay}>
              <Play size={24} fill="currentColor" /> {translation.play}
            </button>

            <div className="selection-card glass">
              <span className="selection-label">{translation.currentSelection}</span>
              <strong>{translation.difficultyNames[difficulty]}</strong>
              <p>{translation.difficultyDescriptions[difficulty]}</p>
            </div>
          </div>
        </div>

        <div className="hero-side">
          <div className="mascot-panel glass">
            <div className="panel-meta">
              <span>{translation.robotLabel}</span>
              <p>{translation.robotIntro}</p>
            </div>
            <Mascot status="idle" className="mascot-large" message={translation.mascotMessages.idle} />
            <div className="robot-note">
              <strong>{translation.noHints}</strong>
              <p>{translation.robotRules}</p>
            </div>
          </div>
        </div>
      </div>

      <section className="difficulty-section">
        <div className="section-heading">
          <h2>{translation.difficultyLabel}</h2>
          <p>{translation.difficultyDescription}</p>
        </div>
        <div className="difficulty-grid" role="radiogroup" aria-label={translation.difficultyLabel}>
          {levels.map((level) => (
            <button
              key={level}
              type="button"
              className={`glass diff-card ${difficulty === level ? 'selected' : ''}`}
              onClick={() => onDifficultyChange(level)}
              role="radio"
              aria-checked={difficulty === level}
            >
              <h2>{translation.difficultyNames[level]}</h2>
              <p>{translation.difficultyDescriptions[level]}</p>
            </button>
          ))}
        </div>
      </section>

      <section className="stats-container" aria-labelledby="stats-heading">
        <h2 id="stats-heading" className="stats-heading">
          <Trophy size={20} /> {translation.progress}
        </h2>
        <div className="stats-grid">
          {levels.map((level) => (
            <article key={level} className="stat-item glass">
              <div className="stat-info">
                <h3>{translation.difficultyNames[level]}</h3>
                <p className="stat-copy">{stats[level].won} {translation.wins}</p>
              </div>
              <div className="stat-val">
                <div className="stat-strong">{stats[level].played} {translation.games}</div>
                <div className="stat-copy">{translation.best}: {stats[level].bestTime === null ? '--:--' : formatTime(stats[level].bestTime)}</div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </motion.section>
  )
}

function formatTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`
}
