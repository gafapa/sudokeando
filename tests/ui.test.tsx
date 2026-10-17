import assert from 'node:assert/strict'
import { after, afterEach, test } from 'node:test'
import { JSDOM } from 'jsdom'
import { IDBFactory } from 'fake-indexeddb'
import { act, useState } from 'react'
import { createRoot } from 'react-dom/client'
import type { Root } from 'react-dom/client'
import type { Difficulty } from '../src/types.ts'

const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', { url: 'http://localhost/sudokeando/', pretendToBeVisual: true })
for (const [key, value] of Object.entries({
  window: dom.window, document: dom.window.document, HTMLElement: dom.window.HTMLElement,
  Element: dom.window.Element, SVGElement: dom.window.SVGElement,
  Event: dom.window.Event, KeyboardEvent: dom.window.KeyboardEvent,
  getComputedStyle: dom.window.getComputedStyle.bind(dom.window),
  requestAnimationFrame: dom.window.requestAnimationFrame.bind(dom.window),
  cancelAnimationFrame: dom.window.cancelAnimationFrame.bind(dom.window),
  indexedDB: new IDBFactory(), IS_REACT_ACT_ENVIRONMENT: true, BroadcastChannel: undefined,
})) Object.defineProperty(globalThis, key, { configurable: true, writable: true, value })
dom.window.matchMedia = () => ({ matches: true, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} }) as unknown as MediaQueryList

const { GameScreen } = await import('../src/components/GameScreen.tsx')
const { HomeScreen } = await import('../src/components/HomeScreen.tsx')
const { default: App } = await import('../src/App.tsx')
const { createBoard, createDefaultStats, formatTime } = await import('../src/lib/game.ts')
const { translations } = await import('../src/lib/i18n.ts')
let root: Root | undefined
const container = document.getElementById('root')!
afterEach(async () => { await act(async () => root?.unmount()); root = undefined })
after(() => dom.window.close())

const noAction = () => {}

test('initial Tab focus accepts digits, arrow navigation, deletion, and preserves shortcuts', async () => {
  function Harness() {
    const [selected, setSelected] = useState<[number, number] | null>(null)
    const [board, setBoard] = useState(() => createBoard('-'.repeat(81)))
    return <GameScreen board={board} selectedCell={selected} difficulty="easy" language="es" theme="light"
      translation={translations.es} timer={0} formatTime={formatTime} mascotStatus="idle" mascotMessage="Ready"
      onBack={noAction} onRestart={noAction} onLanguageChange={noAction} onThemeToggle={noAction}
      onCellClick={(row, column) => setSelected([row, column])}
      onInput={(value) => {
        if (!selected) return
        setBoard((current) => current.map((row, r) => row.map((cell, c) => r === selected[0] && c === selected[1] ? { ...cell, value } : cell)))
      }} />
  }
  root = createRoot(container)
  await act(async () => root!.render(<Harness />))
  const cells = container.querySelectorAll<HTMLButtonElement>('[role="gridcell"]')
  assert.equal(cells.length, 81)
  await act(async () => cells[0].focus())
  await act(async () => cells[0].dispatchEvent(new KeyboardEvent('keydown', { key: '7', bubbles: true })))
  assert.equal(cells[0].textContent, '7')
  await act(async () => cells[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true })))
  assert.equal(document.activeElement, cells[1])
  await act(async () => cells[1].dispatchEvent(new KeyboardEvent('keydown', { key: '8', bubbles: true })))
  assert.equal(cells[1].textContent, '8')
  await act(async () => cells[1].dispatchEvent(new KeyboardEvent('keydown', { key: '2', ctrlKey: true, bubbles: true })))
  assert.equal(cells[1].textContent, '8')
  await act(async () => cells[1].dispatchEvent(new KeyboardEvent('keydown', { key: 'Delete', bubbles: true })))
  assert.equal(cells[1].textContent, '')
})

test('difficulty radios support arrows and theme labels name the destination', async () => {
  function Harness() {
    const [difficulty, setDifficulty] = useState<Difficulty>('easy')
    const stats = createDefaultStats()
    stats.medium = { played: 7, won: 2, bestTime: 100 }
    return <HomeScreen difficulty={difficulty} language="en" theme="light" translation={translations.en}
      stats={stats} onDifficultyChange={setDifficulty} onPlay={noAction} onThemeToggle={noAction} onLanguageChange={noAction} />
  }
  root = createRoot(container)
  await act(async () => root!.render(<Harness />))
  const radios = container.querySelectorAll<HTMLButtonElement>('[role="radio"]')
  await act(async () => radios[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true })))
  assert.equal(radios[1].getAttribute('aria-checked'), 'true')
  assert.equal(radios[1].tabIndex, 0)
  assert.equal(radios[0].tabIndex, -1)
  assert.equal(document.activeElement, radios[1])
  assert.equal(container.querySelector('.theme-toggle')?.getAttribute('aria-label'), 'Dark mode')
  assert.deepEqual([...container.querySelectorAll('.stat-metric strong')].map((element) => element.textContent), ['2', '7', '1:40'])
})

test('full gameplay validates only at completion and records exactly one victory', async () => {
  Object.defineProperty(globalThis, 'indexedDB', { configurable: true, value: new IDBFactory() })
  root = createRoot(container)
  await act(async () => root!.render(<App />))
  const language = container.querySelector<HTMLSelectElement>('select')!
  await act(async () => {
    language.value = 'en'
    language.dispatchEvent(new Event('change', { bubbles: true }))
  })
  await act(async () => container.querySelector<HTMLButtonElement>('.play-btn')!.click())
  await act(async () => { await new Promise((resolve) => setTimeout(resolve, 500)) })
  const emptyCells = [...container.querySelectorAll<HTMLButtonElement>('.cell.user-input')]
  assert.ok(emptyCells.length > 0)
  let firstCorrect = 0
  for (const [index, cell] of emptyCells.entries()) {
    await act(async () => cell.focus())
    const hint = container.querySelector('.mascot-bubble')!.textContent!
    const value = Number(hint.match(/\d+/g)?.at(-1))
    assert.ok(value >= 1 && value <= 9, hint)
    if (index === 0) firstCorrect = value
    const input = index === 0 ? value % 9 + 1 : value
    await act(async () => container.querySelectorAll<HTMLButtonElement>('.num-btn')[input - 1].click())
    if (index < emptyCells.length - 1) assert.equal(container.querySelectorAll('[aria-invalid="true"]').length, 0)
  }
  assert.equal(container.querySelectorAll('[aria-invalid="true"]').length, 1)
  assert.match(emptyCells[0].getAttribute('aria-label')!, /Incorrect value/)
  await act(async () => emptyCells[0].focus())
  await act(async () => container.querySelectorAll<HTMLButtonElement>('.num-btn')[firstCorrect - 1].click())
  assert.equal(container.querySelectorAll('[aria-invalid="true"]').length, 0)
  const { updateStats } = await import('../src/lib/storage.ts')
  await act(async () => {
    assert.equal((await updateStats()).easy.won, 1)
  })
  await act(async () => container.querySelectorAll<HTMLButtonElement>('.num-btn')[0].click())
  await act(async () => {
    const stats = await updateStats()
    assert.equal(stats.easy.played, 1)
    assert.equal(stats.easy.won, 1)
  })
})

test('the application stays playable when browser storage is denied', async () => {
  Object.defineProperty(window, 'localStorage', { configurable: true, get: () => { throw new Error('denied') } })
  Object.defineProperty(globalThis, 'indexedDB', { configurable: true, get: () => { throw new Error('denied') } })
  root = createRoot(container)
  await act(async () => root!.render(<App />))
  assert.match(container.querySelector('.notice')?.textContent ?? '', /No se puede guardar/)
  const play = container.querySelector<HTMLButtonElement>('.play-btn')!
  await act(async () => play.click())
  await act(async () => { await new Promise((resolve) => setTimeout(resolve, 500)) })
  assert.equal(container.querySelectorAll('[role="gridcell"]').length, 81)
  assert.equal(container.querySelectorAll('.cell.initial').length > 0, true)
})
