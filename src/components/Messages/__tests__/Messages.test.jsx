import { describe, it, expect, vi, beforeEach } from 'vitest'
import { act } from '@testing-library/react'
import { renderController, lastControllerProps } from '../../../__tests__/helpers/renderController'

const dmm = vi.hoisted(() => {
  const { createDriverMessagesMapTestContext } = require('../../../__tests__/helpers/driverMessagesMapTestHelpers')
  return createDriverMessagesMapTestContext(vi)
})

vi.mock('../../../contexts/WebsocketContext', () => ({
  useWebsocket: () => dmm.mockSocket
}))

vi.mock('../../../contexts/SessionContext', () => ({
  useSession: () => [{
    auth: true,
    loading: false,
    user: { id: 8, name: 'Test User', level: 4 },
    token: 'session-tok'
  }]
}))

vi.mock('../../../contexts/ApiContext', () => ({
  useApi: () => [dmm.mockOrdering]
}))

import { Messages } from '../index'

describe('Messages', () => {
  const messagesState = {
    loading: false,
    error: null,
    messages: [{ id: 1, order_id: 101, comment: 'Hi' }]
  }

  beforeEach(() => dmm.reset())

  it('sends a text message to the order thread', async () => {
    renderController(Messages, {
      orderId: 101,
      messages: messagesState,
      setMessages: dmm.mockSetMessages
    })
    act(() => {
      lastControllerProps.setMessage('Hello driver')
    })
    await act(async () => {
      await lastControllerProps.handleSend()
    })
    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.test/orders/101/messages',
      expect.objectContaining({ method: 'POST' })
    )
    expect(dmm.mockSetMessages).toHaveBeenCalled()
  })

  it('delegates send to customHandleSend when provided', async () => {
    renderController(Messages, {
      orderId: 101,
      messages: messagesState,
      setMessages: dmm.mockSetMessages,
      customHandleSend: dmm.mockCustomHandleSend
    })
    act(() => {
      lastControllerProps.setMessage('Custom path')
    })
    await act(async () => {
      await lastControllerProps.handleSend()
    })
    expect(dmm.mockCustomHandleSend).toHaveBeenCalledWith('Custom path')
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('appends incoming websocket messages for the active chat', async () => {
    renderController(Messages, {
      orderId: 101,
      messages: messagesState,
      setMessages: dmm.mockSetMessages
    })
    const messageHandlers = dmm.mockSocket.on.mock.calls.filter(([event]) => event === 'message')
    const messageHandler = messageHandlers[messageHandlers.length - 1]?.[1]
    act(() => {
      messageHandler?.({ id: 2, order: { id: 101 }, comment: 'New msg' })
    })
    expect(dmm.mockSetMessages).toHaveBeenCalled()
  })
})
