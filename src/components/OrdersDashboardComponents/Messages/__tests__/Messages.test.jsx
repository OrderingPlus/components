import { describe, it, expect, vi, beforeEach } from 'vitest'
import { waitFor, act } from '@testing-library/react'
import { renderController, lastControllerProps } from '../../../../__tests__/helpers/renderController'

const d2 = vi.hoisted(() => {
  const { createDashboardUsersTestContext } = require('../../../../__tests__/helpers/dashboardUsersTestHelpers')
  return createDashboardUsersTestContext(vi)
})

vi.mock('../../../../contexts/LanguageContext', () => ({
  useLanguage: () => [{ loading: false, language: { code: 'en' } }, d2.mockT]
}))

vi.mock('../../../../contexts/SessionContext', () => ({
  useSession: () => [d2.mockSessionState, { changeUser: vi.fn() }]
}))

vi.mock('../../../../contexts/ConfigContext', () => ({
  useConfig: () => [d2.mockConfigState]
}))

vi.mock('../../../../contexts/UtilsContext', () => ({
  useUtils: () => [{ getOrderState: d2.mockGetOrderState }]
}))

vi.mock('../../../../contexts/ApiContext', () => ({
  useApi: () => [d2.mockOrdering]
}))

vi.mock('../../../../contexts/WebsocketContext', () => ({
  useWebsocket: () => d2.mockSocket
}))

import { Messages } from '../index'

describe('Messages', () => {
  beforeEach(() => d2.reset())

  it('builds history comment for status changes', () => {
    renderController(Messages, {
      orderId: 101,
      messages: { messages: [], loading: false },
      setMessages: vi.fn()
    })
    const comment = lastControllerProps.getHistoryComment({
      change: { attribute: 'status', old: 0, new: 7 },
      author: { name: 'Admin', level: 0 }
    })
    expect(comment).toContain('ORDER_ATTRIBUTE_CHANGED_FROM_TO')
    expect(d2.mockGetOrderState).toHaveBeenCalled()
  })

  it('builds history comment for driver assignment', () => {
    renderController(Messages, {
      orderId: 101,
      messages: { messages: [], loading: false },
      setMessages: vi.fn()
    })
    const comment = lastControllerProps.getHistoryComment({
      change: { attribute: 'driver_id', new: 4 },
      driver: { name: 'John', lastname: 'Doe' }
    })
    expect(comment).toContain('DRIVER_ASSIGNED_AS_DRIVER')
  })

  it('sends a message to the order', async () => {
    renderController(Messages, { orderId: 101 })
    act(() => {
      lastControllerProps.setMessage('Hello customer')
    })
    await act(async () => {
      await lastControllerProps.handleSend()
    })
    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.test/orders/101/messages',
      expect.objectContaining({ method: 'POST' })
    )
  })

  it('skips reload when messages prop is controlled', async () => {
    const setMessages = vi.fn()
    renderController(Messages, {
      orderId: 101,
      messages: { messages: [{ id: 1 }], loading: false },
      setMessages
    })
    const messageLoads = global.fetch.mock.calls.filter(([url]) =>
      url.includes('/orders/101/messages') && !url.includes('/read')
    )
    expect(messageLoads).toHaveLength(0)
    await act(async () => {
      await lastControllerProps.handleReadMessages(1)
    })
    const readCalls = global.fetch.mock.calls.filter(([url]) => url.includes('/messages/1/read'))
    expect(readCalls).toHaveLength(0)
  })

  it('loads messages and handles websocket message', async () => {
    renderController(Messages, { orderId: 101, asDashboard: true })
    await waitFor(() => expect(lastControllerProps.messages.loading).toBe(false))
    const messageHandler = d2.mockSocket.on.mock.calls.find(([e]) => e === 'message')?.[1]
    act(() => {
      messageHandler({ id: 99, order: { id: 101 }, comment: 'New msg' })
    })
    expect(lastControllerProps.messages.messages.some(m => m.id === 99)).toBe(true)
  })

  it('builds distance and reject history comments', () => {
    renderController(Messages, { orderId: 101 })
    const distanceComment = lastControllerProps.getHistoryComment({
      change: { attribute: 'distance' },
      driver: { name: 'Alex' }
    })
    expect(distanceComment).toContain('THE_DRIVER_IS_CLOSE')
    const rejectComment = lastControllerProps.getHistoryComment({
      change: { attribute: 'reject_reason', new: 'no_stock' }
    })
    expect(rejectComment).toContain('reject reason')
  })

  it('builds estimated delivery status comment', () => {
    renderController(Messages, { orderId: 101 })
    const comment = lastControllerProps.getHistoryComment({
      change: { attribute: 'status', old: 0, new: 8, estimated: 25 }
    })
    expect(comment).toContain('ESTIMATED_DELIVERY_TIME')
  })

  it('builds driver unassigned comment', () => {
    renderController(Messages, { orderId: 101 })
    const comment = lastControllerProps.getHistoryComment({
      change: { attribute: 'driver_id', new: null }
    })
    expect(comment).toContain('DRIVER_UNASSIGNED')
  })

  it('sends through controlled messages setter', async () => {
    const setMessages = vi.fn()
    renderController(Messages, {
      orderId: 101,
      messages: { messages: [{ id: 1 }], loading: false },
      setMessages
    })
    act(() => {
      lastControllerProps.setMessage('Controlled reply')
    })
    await act(async () => {
      await lastControllerProps.handleSend()
    })
    expect(setMessages).toHaveBeenCalled()
  })

  it('covers additional history attribute branches', () => {
    renderController(Messages, { orderId: 101 })
    const preparedComment = lastControllerProps.getHistoryComment({
      change: { attribute: 'prepared_in', old: 10, new: 20 }
    })
    expect(preparedComment).toContain('ORDER_ATTRIBUTE_CHANGED_FROM_TO')
    const vehicleComment = lastControllerProps.getHistoryComment({
      change: {
        attribute: 'vehicle',
        old: { type: 'car', model: 'X', car_registration: 'ABC', color: 'red' },
        new: { type: 'van', model: 'Y', car_registration: 'XYZ', color: 'blue' }
      }
    })
    expect(vehicleComment).toContain('ORDER_ATTRIBUTE_CHANGED_FROM_TO')
    const genericComment = lastControllerProps.getHistoryComment({
      change: { attribute: 'coupon', old: 'A', new: 'B' }
    })
    expect(genericComment).toContain('ORDER_ATTRIBUTE_CHANGED_FROM_TO')
  })
})
