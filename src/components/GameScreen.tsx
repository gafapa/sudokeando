import { motion } from 'framer-motion'
import { ChevronLeft, Globe, Moon, RotateCcw, Sun, Trash2, Zap } from 'lucide-react'
import { Mascot } from './Mascot'
import { SUPPORTED_LANGUAGES, translations, feedback } from '../lib/i18n'
import type { KeyboardEvent } from 'react'
import type { Difficulty, Language, MascotStatus, PuzzleCell, Theme } from '../types'

type TranslationSet = (typeof translations)[Language]

interface GameScreenProps {
  board: PuzzleCell[][]
  difficulty: Difficulty
  formatTime: (seconds: number) => string
  language: Language
  mascotMessage: string
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
  mascotMessage,
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

  function focusCell(rowIndex: number, columnIndex: number) {
    document
      .querySelector<HTMLButtonElement>(
        `[data-cell-id="${rowIndex}-${columnIndex}"]`,
      )
      ?.focus()
  }

  function handleCellKeyDown(
    event: KeyboardEvent<HTMLButtonElement>,
    rowIndex: number,
    columnIndex: number,
  ) {
    const keyActions: Record<string, [number, number]> = {
      ArrowUp: [Math.max(rowIndex - 1, 0), columnIndex],
      ArrowDown: [Math.min(rowIndex + 1, 8), columnIndex],
      ArrowLeft: [rowIndex, Math.max(columnIndex - 1, 0)],
      ArrowRight: [rowIndex, Math.min(columnIndex + 1, 8)],
      Home: [rowIndex, 0],
      End: [rowIndex, 8],
    }

    const nextCell = keyActions[event.key]

    if (nextCell) {
      event.preventDefault()
      focusCell(nextCell[0], nextCell[1])
      return
    }

    if (event.ctrlKey || event.metaKey || event.altKey) return

    if (/^[1-9]$/.test(event.key)) {
      event.preventDefault()
      onInput(Number.parseInt(event.key, 10))
      return
    }

    if (event.key === 'Backspace' || event.key === 'Delete' || event.key === '0') {
      event.preventDefault()
      onInput(null)
    }
  }

  return (
    <motion.section
      className="game-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <header className="game-topbar glass">
        <button type="button" className="back-btn" onClick={onBack} aria-label={translation.backToMenu}>
          <ChevronLeft size={22} /> <span>{translation.menu}</span>
        </button>

        <div className="topbar-tools">
          <button type="button" className="theme-toggle compact-toggle restart-btn" onClick={onRestart} aria-label={translation.restart} title={translation.restart}>
            <RotateCcw size={18} />
          </button>
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
            aria-label={translation.modeLabel[theme === 'dark' ? 'light' : 'dark']}
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </header>


      <div className="board-viewport">
        <div
          className="board glass"
          role="grid"
          aria-colcount={9}
          aria-rowcount={9}
          aria-label={`${translation.boardLabel}: ${translation.difficultyNames[difficulty]}`}
        >
          {board.map((row, rowIndex) => (
            <div className="board-row" role="row" key={rowIndex} aria-rowindex={rowIndex + 1}>
              {row.map((cell, columnIndex) => {
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
                const isTabStop =
                  isSelected || (selectedCell === null && rowIndex === 0 && columnIndex === 0)

                return (
                  <button
                    key={`${rowIndex}-${columnIndex}`}
                    type="button"
                    role="gridcell"
                    className={`cell ${(Math.floor(rowIndex / 3) + Math.floor(columnIndex / 3)) % 2 === 0 ? 'block-tint' : ''} ${cell.initial ? 'initial' : 'user-input'} ${cell.error ? 'error' : ''} ${
                      isSelected ? 'selected' : ''
                    } ${isRelatedToSelected ? 'active' : ''} ${isSameValue ? 'same-value' : ''} ${
                      columnIndex === 2 || columnIndex === 5 ? 'block-right' : ''
                    } ${rowIndex === 2 || rowIndex === 5 ? 'block-bottom' : ''}`}
                    data-cell-id={`${rowIndex}-${columnIndex}`}
                    onFocus={() => onCellClick(rowIndex, columnIndex)}
                    onClick={() => { if (!isSelected) onCellClick(rowIndex, columnIndex) }}
                    onKeyDown={(event) => handleCellKeyDown(event, rowIndex, columnIndex)}
                    aria-colindex={columnIndex + 1}
                    aria-rowindex={rowIndex + 1}
                    aria-selected={isSelected}
                    aria-readonly={cell.initial}
                    aria-invalid={cell.error || undefined}
                    tabIndex={isTabStop ? 0 : -1}
                    aria-label={`${translation.row} ${rowIndex + 1}, ${translation.column} ${columnIndex + 1}${
                      cell.value === null ? `, ${translation.emptyCell}` : `, ${translation.value} ${cell.value}`
                    }, ${cell.initial ? translation.fixedCell : translation.editableCell}${cell.error ? `, ${feedback[language].invalid}` : ''}`}
                  >
                    {cell.value ?? ''}
                  </button>
                )
              })}
            </div>
          ))}
        </div>

      </div>
      <aside className="game-controls">
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
            message={mascotMessage}
          />
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
      </aside>
    </motion.section>
  )
}
