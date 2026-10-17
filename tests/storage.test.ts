import assert from 'node:assert/strict'
import { beforeEach, test } from 'node:test'
import { IDBFactory } from 'fake-indexeddb'
import { createDefaultStats, STORAGE_KEY_STATS } from '../src/lib/game.ts'
import { readPreference, writePreference, updateStats, openStatsDatabase } from '../src/lib/storage.ts'

const preferences = new Map<string, string>()
beforeEach(() => {
  preferences.clear()
  Object.defineProperty(globalThis, 'indexedDB', { configurable: true, value: new IDBFactory() })
  Object.defineProperty(globalThis, 'window', { configurable: true, value: {
    localStorage: {
      getItem: (key: string) => preferences.get(key) ?? null,
      setItem: (key: string, value: string) => preferences.set(key, value),
    },
  } })
})

test('concurrent first-use migrations import legacy totals exactly once', async () => {
  const legacy = createDefaultStats()
  legacy.easy = { played: 10, won: 3, bestTime: 120 }
  preferences.set(STORAGE_KEY_STATS, JSON.stringify(legacy))
  await Promise.all(Array.from({ length: 12 }, (_, index) => updateStats({ gameId: `game-${index}`, difficulty: 'easy' })))
  const result = await updateStats()
  assert.deepEqual(result.easy, { played: 22, won: 3, bestTime: 120 })
  assert.equal(preferences.get(STORAGE_KEY_STATS), JSON.stringify(legacy))
})

test('concurrent wins are atomic and repeated receipts do not duplicate results', async () => {
  await Promise.all(Array.from({ length: 20 }, (_, index) => updateStats({ gameId: `win-${index}`, difficulty: 'hard', elapsed: 100 - index })))
  await Promise.all(Array.from({ length: 10 }, () => updateStats({ gameId: 'win-0', difficulty: 'hard', elapsed: 1 })))
  await updateStats({ gameId: 'win-0', difficulty: 'hard' })
  assert.deepEqual((await updateStats()).hard, { played: 20, won: 20, bestTime: 81 })
})

test('difficulty conflicts abort without changing aggregates or receipts', async () => {
  await updateStats({ gameId: 'same-game', difficulty: 'medium' })
  await assert.rejects(updateStats({ gameId: 'same-game', difficulty: 'expert', elapsed: 5 }))
  assert.equal((await updateStats()).medium.played, 1)
  assert.equal((await updateStats()).expert.played, 0)
  await updateStats({ gameId: 'same-game', difficulty: 'medium', elapsed: 30 })
  assert.equal((await updateStats()).medium.won, 1)
})

test('aborted writes leave previously committed totals unchanged', async () => {
  await updateStats({ gameId: 'committed', difficulty: 'easy' })
  const database = await openStatsDatabase()
  const transaction = database.transaction('stats', 'readwrite')
  transaction.objectStore('stats').put(createDefaultStats(), 'current')
  const aborted = new Promise<void>((resolve) => { transaction.onabort = () => resolve() })
  transaction.abort()
  await aborted
  database.close()
  assert.equal((await updateStats()).easy.played, 1)
})

test('storage policy failures are caught and database failures reject explicitly', async () => {
  Object.defineProperty(window, 'localStorage', { get: () => { throw new Error('denied') } })
  assert.equal(readPreference('theme'), null)
  assert.equal(writePreference('theme', 'dark'), false)
  assert.deepEqual(await updateStats(), createDefaultStats())
  Object.defineProperty(globalThis, 'indexedDB', { configurable: true, get: () => { throw new Error('denied') } })
  await assert.rejects(updateStats(), /denied/)
})

test('invalid elapsed time is rejected before opening a transaction', async () => {
  for (const elapsed of [-1, Infinity, NaN, 1.5]) {
    await assert.rejects(updateStats({ gameId: 'invalid', difficulty: 'easy', elapsed }))
  }
  assert.deepEqual(await updateStats(), createDefaultStats())
})
