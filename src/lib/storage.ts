import { createDefaultStats, parseStoredStats, STORAGE_KEY_STATS } from './game.ts'
import type { Difficulty, GameStats } from '../types.ts'

export function readPreference(key: string): string | null {
  try { return window.localStorage.getItem(key) } catch { return null }
}

export function writePreference(key: string, value: string): boolean {
  try { window.localStorage.setItem(key, value); return true } catch { return false }
}

export function openStatsDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    let blocked = false
    const request = indexedDB.open('sudokeando', 1)
    request.onupgradeneeded = () => {
      request.result.createObjectStore('stats')
      request.result.createObjectStore('games')
    }
    request.onerror = () => reject(request.error)
    request.onblocked = () => {
      blocked = true
      reject(new Error('Statistics database is blocked'))
    }
    request.onsuccess = () => {
      const database = request.result
      if (blocked) { database.close(); return }
      database.onversionchange = () => database.close()
      resolve(database)
    }
  })
}

export interface StatsEvent {
  gameId: string
  difficulty: Difficulty
  elapsed?: number
}

// The aggregate and receipt commit together, including the one-time legacy migration.
export async function updateStats(event?: StatsEvent): Promise<GameStats> {
  if (event && (!event.gameId || !['easy', 'medium', 'hard', 'expert'].includes(event.difficulty) ||
    (event.elapsed !== undefined && (!Number.isSafeInteger(event.elapsed) || event.elapsed < 0)))) {
    throw new Error('Invalid statistics event')
  }
  const database = await openStatsDatabase()
  try {
    return await new Promise<GameStats>((resolve, reject) => {
      const transaction = database.transaction(['stats', 'games'], 'readwrite')
      const aggregate = transaction.objectStore('stats')
      const games = transaction.objectStore('games')
      let result = createDefaultStats()
      transaction.oncomplete = () => resolve(result)
      transaction.onerror = () => reject(transaction.error)
      transaction.onabort = () => reject(transaction.error ?? new Error('Statistics transaction aborted'))
      const request = aggregate.get('current')
      request.onsuccess = () => {
        result = request.result ?? parseStoredStats(readPreference(STORAGE_KEY_STATS))
        if (!event) {
          if (request.result === undefined) aggregate.put(result, 'current')
          return
        }
        const receipt = games.get(event.gameId)
        receipt.onsuccess = () => {
          const previous = receipt.result as { difficulty: Difficulty; won: boolean } | undefined
          const level = result[event.difficulty]
          if (previous && previous.difficulty !== event.difficulty) {
            transaction.abort()
            return
          }
          if (!previous) level.played += 1
          const won = event.elapsed !== undefined
          if (won && !previous?.won) {
            level.won += 1
            level.bestTime = level.bestTime === null ? event.elapsed! : Math.min(level.bestTime, event.elapsed!)
          }
          games.put({ difficulty: event.difficulty, won: previous?.won || won }, event.gameId)
          aggregate.put(result, 'current')
        }
      }
    })
  } finally { database.close() }
}
