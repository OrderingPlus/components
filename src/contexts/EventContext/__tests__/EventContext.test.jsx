import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, act } from '@testing-library/react'
import { EventProvider, useEvent } from '../index'

describe('EventContext', () => {
  it('provides shared emitter inside provider', () => {
    let captured
    const EventConsumer = () => {
      const [events] = useEvent()
      captured = events
      return null
    }

    render(
      <EventProvider>
        <EventConsumer />
      </EventProvider>
    )

    const handler = vi.fn()
    captured.on('test:event', handler)
    captured.emit('test:event', { ok: true })
    expect(handler).toHaveBeenCalledWith({ ok: true })
  })

  it('falls back to standalone emitter outside provider', () => {
    const TestHook = () => {
      const [events] = useEvent()
      expect(typeof events.emit).toBe('function')
      return null
    }
    render(<TestHook />)
  })
})
