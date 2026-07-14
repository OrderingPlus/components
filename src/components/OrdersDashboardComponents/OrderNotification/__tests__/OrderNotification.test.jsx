import { describe, it, expect, vi, beforeEach } from 'vitest'
import { act } from '@testing-library/react'
import { renderController, lastControllerProps } from '../../../../__tests__/helpers/renderController'

const d1 = vi.hoisted(() => {
  const { createDashboardOrdersTestContext } = require('../../../../__tests__/helpers/dashboardOrdersTestHelpers')
  return createDashboardOrdersTestContext(vi)
})

vi.mock('../../../../contexts/EventContext', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    useEvent: () => [{ emit: d1.mockEmit, on: d1.mockEventsOn, off: d1.mockEventsOff }]
  }
})

vi.mock('../../../../contexts/SessionContext', () => ({
  useSession: () => [d1.mockSessionState, { changeUser: vi.fn() }]
}))

vi.mock('../../../../contexts/WebsocketContext', () => ({
  useWebsocket: () => d1.mockSocket
}))

import { OrderNotification } from '../index'

describe('OrderNotification', () => {
  beforeEach(() => d1.reset())

  it('emits order_added when websocket registers a new order', () => {
    renderController(OrderNotification, {})
    const registerHandler = d1.mockSocket.on.mock.calls.find(([event]) => event === 'orders_register')?.[1]
    expect(registerHandler).toBeTruthy()
    const incomingOrder = { id: 55, status: 0 }
    act(() => {
      registerHandler(incomingOrder)
    })
    expect(d1.mockEmit).toHaveBeenCalledWith('order_added', incomingOrder)
  })
})
