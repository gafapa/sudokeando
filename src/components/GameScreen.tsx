import { motion } from 'framer-motion'
import { ChevronLeft, Lightbulb, RotateCcw, Trash2, Zap } from 'lucide-react'
import { Mascot } from './Mascot'
import type { Difficulty, MascotStatus, PuzzleCell } from '../types'

interface GameScreenProps {
  board: PuzzleCell[][]
  difficulty: Difficulty
  formatTime: (seconds: number) => string
  gameLabel: string
  mascotStatus: MascotStatus
  onBack: () => void
  onCellClick: (rowIndex: number, columnIndex: number) => void
  onHint: () => void
  onInput: (value: number | null) => void
  onRestart: () => void
  selectedCell: [number, number] | null
  timer: number
}

export function GameScreen({
  board,
  difficulty,
  formatTime,
  gameLabel,
  mascotStatus,
  onBack,
  onCellClick,
  onHint,
  onInput,
  onRestart,
  selectedCell,
  timer,
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
      <header className="game-header">
        <button type="button" className="back-btn" onClick={onBack} aria-label="Back to menu">
          <ChevronLeft size={24} /> Menu
        </button>
        <div className="difficulty-tag" aria-label={`Current difficulty: ${difficulty}`}>
          {gameLabel}
        </div>
        <div className="timer" aria-label={`Elapsed time ${formatTime(timer)}`}>
          <Zap size={18} fill="currentColor" /> {formatTime(timer)}
        </div>
      </header>

      <div className="game-mascot-container">
        <Mascot status={mascotStatus} className="mascot-small" />
      </div>

      <div className="board glass" role="grid" aria-label={`${difficulty} Sudoku board`}>
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
                aria-label={`Row ${rowIndex + 1} column ${columnIndex + 1}${
                  cell.value === null ? ', empty' : `, value ${cell.value}`
                }${cell.initial ? ', fixed cell' : ', editable cell'}`}
                aria-pressed={isSelected}
              >
                {cell.value ?? ''}
              </button>
            )
          }),
        )}
      </div>

      <div className="num-pad" aria-label="Number pad">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((numberValue) => (
          <button
            key={numberValue}
            type="button"
            className="num-btn"
            onClick={() => onInput(numberValue)}
            aria-label={`Insert ${numberValue}`}
          >
            {numberValue}
          </button>
        ))}
        <button
          type="button"
          className="num-btn special"
          onClick={() => onInput(null)}
          aria-label="Clear selected cell"
        >
          <Trash2 size={20} />
        </button>
      </div>

      <div className="actions">
        <button type="button" className="action-btn btn-secondary" onClick={onHint}>
          <Lightbulb size={20} /> Hint
        </button>
        <button type="button" className="action-btn btn-primary" onClick={onRestart}>
          <RotateCcw size={20} /> Restart
        </button>
      </div>
    </motion.section>
  )
}
