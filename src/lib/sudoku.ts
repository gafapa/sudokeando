import { getSudoku } from 'sudoku-gen'
import type { Difficulty } from '../types'

interface GeneratedSudoku {
  puzzle: string
  solution: string
  difficulty: Difficulty
}

const generatorDifficultyByLevel: Record<Difficulty, Difficulty> = {
  easy: 'easy',
  medium: 'medium',
  hard: 'hard',
  expert: 'expert',
}

export function createSudokuForDifficulty(difficulty: Difficulty): GeneratedSudoku {
  const generatorDifficulty = generatorDifficultyByLevel[difficulty]
  const generatedSudoku = getSudoku(generatorDifficulty) as GeneratedSudoku

  if (!/^[1-9-]{81}$/.test(generatedSudoku.puzzle) || !/^[1-9]{81}$/.test(generatedSudoku.solution) ||
    [...generatedSudoku.puzzle].some((value, index) => value !== '-' && value !== generatedSudoku.solution[index])) {
    throw new Error('Invalid generated Sudoku')
  }
  for (let index = 0; index < 9; index += 1) {
    const row = generatedSudoku.solution.slice(index * 9, index * 9 + 9)
    const column = Array.from({ length: 9 }, (_, offset) => generatedSudoku.solution[offset * 9 + index])
    const box = Array.from({ length: 9 }, (_, offset) =>
      generatedSudoku.solution[(Math.floor(index / 3) * 3 + Math.floor(offset / 3)) * 9 + (index % 3) * 3 + offset % 3])
    if ([row, column, box].some((group) => new Set(group).size !== 9)) {
      throw new Error('Invalid generated solution')
    }
  }

  return {
    puzzle: generatedSudoku.puzzle,
    solution: generatedSudoku.solution,
    difficulty: generatedSudoku.difficulty,
  }
}
