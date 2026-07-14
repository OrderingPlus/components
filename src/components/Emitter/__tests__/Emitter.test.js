import { describe, it, expect, vi } from 'vitest'
import { Emitter } from '../index'

describe('Emitter', () => {
  it('registers and emits events', () => {
    const emitter = new Emitter()
    const handler = vi.fn()
    emitter.on('order:updated', handler)
    emitter.emit('order:updated', { id: 1 })
    expect(handler).toHaveBeenCalledWith({ id: 1 })
  })

  it('removes listeners with off', () => {
    const emitter = new Emitter()
    const handler = vi.fn()
    emitter.on('test', handler)
    emitter.off('test', handler)
    emitter.emit('test', 'payload')
    expect(handler).not.toHaveBeenCalled()
  })

  it('no-ops emit/off for unknown event names', () => {
    const emitter = new Emitter()
    expect(() => emitter.emit('missing')).not.toThrow()
    expect(() => emitter.off('missing', () => {})).not.toThrow()
  })
})
