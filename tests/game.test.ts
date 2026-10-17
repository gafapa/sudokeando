import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createBoard, createDefaultStats, isBoardComplete, isSolvedBoard, markSolutionErrors, parseStoredStats, formatTime, getElapsedSeconds } from '../src/lib/game.ts'
import { createSudokuForDifficulty } from '../src/lib/sudoku.ts'

test('malformed, negative, unsafe and inconsistent stored statistics are rejected', () => {
  for (const raw of ['null', '{', '[]', '1', '"text"']) {
    assert.deepEqual(parseStoredStats(raw), createDefaultStats())
  }
  const invalid = createDefaultStats()
  invalid.easy.played = Number.MAX_SAFE_INTEGER + 1
  assert.deepEqual(parseStoredStats(JSON.stringify(invalid)), createDefaultStats())
  invalid.easy.played = 0
  invalid.easy.won = 1
  assert.deepEqual(parseStoredStats(JSON.stringify(invalid)), createDefaultStats())
})

test('valid legacy statistics survive parsing without sharing mutable references', () => {
  const legacy = createDefaultStats()
  legacy.hard = { played: 8, won: 2, bestTime: 123 }
  assert.deepEqual(parseStoredStats(JSON.stringify(legacy)), legacy)
  const first = createDefaultStats()
  first.easy.played = 5
  assert.equal(createDefaultStats().easy.played, 0)
})

test('board completion and solution validation reject malformed boards', () => {
  assert.equal(isBoardComplete([]), false)
  assert.equal(isSolvedBoard([], ''), false)
  assert.throws(() => createBoard('-'.repeat(80)))
  assert.equal(isBoardComplete(createBoard('-'.repeat(81))), false)
})

for (const difficulty of ['easy', 'medium', 'hard', 'expert'] as const) {
  test(`${difficulty}: generated puzzles have valid clues and completed solutions`, () => {
    for (let sample = 0; sample < 25; sample += 1) {
      const { puzzle, solution } = createSudokuForDifficulty(difficulty)
      const board = createBoard(puzzle)
      assert.equal(isBoardComplete(board), false)
      assert.equal(isSolvedBoard(createBoard(solution), solution), true)
      for (let index = 0; index < 81; index += 1) {
        if (puzzle[index] !== '-') assert.equal(puzzle[index], solution[index])
      }
      const empty = board.flat().findIndex((cell) => !cell.initial)
      const row = Math.floor(empty / 9)
      const column = empty % 9
      const completed = createBoard(solution)
      completed[row][column] = { value: Number(solution[empty]) % 9 + 1, initial: false, error: false }
      assert.equal(isSolvedBoard(completed, solution), false)
      const marked = markSolutionErrors(completed, solution)
      assert.equal(marked[row][column].error, true)
      assert.equal(completed[row][column].error, false)
      assert.equal(marked.flat().filter((cell) => cell.error).length, 1)
    }
  })
}

test('time formatting handles invalid values and long games', () => {
  assert.equal(formatTime(61), '1:01')
  assert.equal(formatTime(3601), '60:01')
  assert.equal(formatTime(-1), '0:00')
  assert.equal(formatTime(NaN), '0:00')
})

test('elapsed time includes periods without interval callbacks and clamps backward clock changes', () => {
  assert.equal(getElapsedSeconds(1000, 65999), 64)
  assert.equal(getElapsedSeconds(1000, 3601000), 3600)
  assert.equal(getElapsedSeconds(1000, 500), 0)
})
