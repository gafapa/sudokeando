import { motion } from 'framer-motion'
import { ChevronLeft, Globe, Moon, RotateCcw, Sun, Trash2, Zap } from 'lucide-react'
import { Mascot } from './Mascot'
import { SUPPORTED_LANGUAGES, translations } from '../lib/i18n'
import type { Difficulty, Language, MascotStatus, PuzzleCell, Theme } from '../types'

type TranslationSet = (typeof translations)[Language]

interface GameScreenProps {
  board: PuzzleCell[][]
  difficulty: Difficulty
  formatTime: (seconds: number) => string
  language: Language
  mascotStatus: MascotStatus
  onBack: () => void
  onCellClick: (rowIndex: number, columnIndex: number) => void
  onInput: (value: number | null) => void
  onLanguageChange: (language: Language) => void
  onRestart: () => void
  onThemeToggle: () => void
  selectedCell: [number, number] | null
  theme: Theme
  timer: number
  translation: TranslationSet
}

export function GameScreen({
  board,
  difficulty,
  formatTime,
  language,
  mascotStatus,
  onBack,
  onCellClick,
  onInput,
  onLanguageChange,
  onRestart,
  onThemeToggle,
  selectedCell,
  theme,
  timer,
  translation,
}: GameScreenProps) {
  const currentCellValue =
    selectedCell === null ? null : board[selectedCell[0]]?.[selectedCell[1]]?.value ?? null

  return (
    <motion.section
      className="game-screen"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
    >
      <header className="game-topbar glass">
        <button type="button" className="back-btn" onClick={onBack} aria-label={translation.backToMenu}>
          <ChevronLeft size={24} /> {translation.menu}
        </button>

        <div className="topbar-tools">
          <label className="selector-field compact-select">
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
          </label>

          <button
            type="button"
            className="theme-toggle compact-toggle"
            onClick={onThemeToggle}
            aria-label={translation.modeLabel[theme]}
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </header>

      <div className="game-header">
        <div className="difficulty-tag" aria-label={`${translation.currentDifficulty}: ${translation.difficultyNames[difficulty]}`}>
          {translation.difficultyNames[difficulty]}
        </div>
        <div className="timer" aria-label={`${translation.elapsedTime} ${formatTime(timer)}`}>
          <Zap size={18} fill="currentColor" /> {formatTime(timer)}
        </div>
      </div>

      <div className="game-mascot-container">
        <Mascot
          status={mascotStatus}
          className="mascot-small"
          message={translation.mascotMessages[mascotStatus]}
        />
      </div>

      <div className="board glass" role="grid" aria-label={`${translation.boardLabel}: ${translation.difficultyNames[difficulty]}`}>
        {board.map((row, rowIndex) =>
          row.map((cell, columnIndex) => {
            const isSelected =
              selectedCell?.[0] === rowIndex && selectedCell?.[1] === columnIndex
            const isRelatedToSelected =
              selectedCell !== null &&
              (selectedCell[0] === rowIndex ||
                selectedCell[1] === columnIndex ||
                (Math.floor(selectedCell[0] / 3) === Math.floor(rowIndex / 3) &&
                  Math.floor(selectedCell[1] / 3) === Math.floor(columnIndex / 3)))
            const isSameValue =
              cell.value !== null &&
              currentCellValue !== null &&
              cell.value === currentCellValue

            return (
              <button
                key={`${rowIndex}-${columnIndex}`}
                type="button"
                className={`cell ${cell.initial ? 'initial' : 'user-input'} ${cell.error ? 'error' : ''} ${
                  isSelected ? 'selected' : ''
                } ${isRelatedToSelected ? 'active' : ''} ${isSameValue ? 'same-value' : ''}`}
                onClick={() => onCellClick(rowIndex, columnIndex)}
                aria-label={`${translation.row} ${rowIndex + 1}, ${translation.column} ${columnIndex + 1}${
                  cell.value === null ? `, ${translation.emptyCell}` : `, ${translation.value} ${cell.value}`
                }, ${cell.initial ? translation.fixedCell : translation.editableCell}`}
                aria-pressed={isSelected}
              >
                {cell.value ?? ''}
              </button>
            )
          }),
        )}
      </div>

      <div className="num-pad" aria-label={translation.boardLabel}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((numberValue) => (
          <button
            key={numberValue}
            type="button"
            className="num-btn"
            onClick={() => onInput(numberValue)}
            aria-label={`${translation.insertNumber} ${numberValue}`}
          >
            {numberValue}
          </button>
        ))}
        <button
          type="button"
          className="num-btn special"
          onClick={() => onInput(null)}
          aria-label={translation.clearCell}
        >
          <Trash2 size={20} />
        </button>
      </div>

      <div className="actions">
        <button type="button" className="action-btn btn-primary" onClick={onRestart}>
          <RotateCcw size={20} /> {translation.restart}
        </button>
      </div>
    </motion.section>
  )
}
