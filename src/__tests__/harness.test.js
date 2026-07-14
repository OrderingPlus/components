import { describe, it, expect } from 'vitest'

describe('Vitest harness', () => {
  it('runs with jsdom and localStorage', () => {
    window.localStorage.setItem('test', 'ok')
    expect(window.localStorage.getItem('test')).toBe('ok')
  })
})
