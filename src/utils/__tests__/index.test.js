import { describe, it, expect, vi } from 'vitest'
import { randomString, deepEqual } from '../index'

describe('utils/index', () => {
  describe('randomString', () => {
    it('returns string of requested length', () => {
      expect(randomString(8)).toHaveLength(8)
      expect(randomString()).toHaveLength(10)
    })

    it('uses custom alphabet when provided', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0)
      expect(randomString(3, 'abc')).toBe('aaa')
      Math.random.mockRestore()
    })
  })

  describe('deepEqual', () => {
    it('returns true for deeply equal objects', () => {
      expect(deepEqual({ a: 1, b: { c: 2 } }, { a: 1, b: { c: 2 } })).toBe(true)
    })

    it('returns false for different key counts', () => {
      expect(deepEqual({ a: 1 }, { a: 1, b: 2 })).toBe(false)
    })

    it('returns false for different primitive values', () => {
      expect(deepEqual({ a: 1 }, { a: 2 })).toBe(false)
    })

    it('returns false for nested differences', () => {
      expect(deepEqual({ a: { b: 1 } }, { a: { b: 2 } })).toBe(false)
    })
  })
})
