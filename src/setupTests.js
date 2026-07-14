import { expect, afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import * as matchers from '@testing-library/jest-dom/matchers'

expect.extend(matchers)

const createMemoryStorage = () => {
  const store = new Map()
  return {
    get length () {
      return store.size
    },
    clear () {
      store.clear()
    },
    getItem (key) {
      return store.has(String(key)) ? store.get(String(key)) : null
    },
    key (index) {
      return Array.from(store.keys())[index] ?? null
    },
    removeItem (key) {
      store.delete(String(key))
    },
    setItem (key, value) {
      store.set(String(key), String(value))
    }
  }
}

Object.defineProperty(window, 'localStorage', {
  configurable: true,
  writable: true,
  value: createMemoryStorage()
})

Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  writable: true,
  value: window.localStorage
})

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn()
  }))
})

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
  window.localStorage.clear()
})
