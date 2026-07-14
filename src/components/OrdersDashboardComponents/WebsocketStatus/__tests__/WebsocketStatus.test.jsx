import { describe, it, expect, vi, beforeEach } from 'vitest'
import { act } from '@testing-library/react'
import { renderController, lastControllerProps } from '../../../../__tests__/helpers/renderController'

const d2 = vi.hoisted(() => {
  const { createDashboardUsersTestContext } = require('../../../../__tests__/helpers/dashboardUsersTestHelpers')
  return createDashboardUsersTestContext(vi)
})

vi.mock('../../../../contexts/LanguageContext', () => ({
  useLanguage: () => [{ loading: false, language: { code: 'en' } }, d2.mockT]
}))

vi.mock('../../../../contexts/WebsocketContext', () => ({
  useWebsocket: () => d2.mockSocket
}))

import { WebsocketStatus } from '../index'

describe('WebsocketStatus', () => {
  beforeEach(() => d2.reset())

  it('exposes websocket status labels', () => {
    renderController(WebsocketStatus, {})
    expect(lastControllerProps.getWebsocketStatus(1)).toBe('Ok')
    expect(lastControllerProps.getWebsocketStatus(2)).toBe('Disconnected')
  })

  it('updates status on socket connect', () => {
    renderController(WebsocketStatus, {})
    act(() => {
      d2.socketHandlers.connect?.()
    })
    expect(lastControllerProps.socketStatus).toBe(1)
    expect(lastControllerProps.reconnectAttemptCount).toBe(0)
  })

  it('updates status on socket disconnect', () => {
    renderController(WebsocketStatus, {})
    act(() => {
      d2.socketHandlers.disconnect?.('transport close')
    })
    expect(lastControllerProps.socketStatus).toBe(2)
  })

  it('increments reconnect attempts', () => {
    renderController(WebsocketStatus, {})
    act(() => {
      d2.socketHandlers.reconnect_attempt?.()
    })
    expect(lastControllerProps.reconnectAttemptCount).toBe(1)
  })

  it('exposes connecting status label and updates on reconnect attempt', () => {
    renderController(WebsocketStatus, {})
    expect(lastControllerProps.getWebsocketStatus(0)).toBe('Connecting')
    act(() => {
      d2.socketHandlers.reconnect_attempt?.()
    })
    expect(lastControllerProps.socketStatus).toBe(0)
  })
})
