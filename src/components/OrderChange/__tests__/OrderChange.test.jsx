import { describe, it, expect, vi, beforeEach } from 'vitest'
import { act } from '@testing-library/react'
import { renderController, lastControllerProps } from '../../../__tests__/helpers/renderController'

const orders = vi.hoisted(() => {
  const { createCustomerOrdersTestContext } = require('../../../__tests__/helpers/customerOrdersTestHelpers')
  return createCustomerOrdersTestContext(vi)
})

vi.mock('../../../contexts/EventContext', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    useEvent: () => [{ emit: orders.mockEmit, on: orders.mockEventsOn, off: orders.mockEventsOff }]
  }
})

vi.mock('../../../contexts/LanguageContext', () => ({
  useLanguage: () => [{ loading: false, language: { code: 'en' } }, orders.mockT]
}))

vi.mock('../../../contexts/ToastContext', () => ({
  useToast: () => [[], { showToast: orders.mockShowToast }],
  ToastType: { error: 'error', success: 'success', info: 'info' }
}))

vi.mock('../../../contexts/SessionContext', () => ({
  useSession: () => [{
    auth: true,
    loading: false,
    user: { id: 8, name: 'Test User', level: 0 },
    token: 'session-tok'
  }]
}))

vi.mock('../../../contexts/OrderContext', () => ({
  useOrder: () => [orders.mockOrderState, {
    reorder: orders.mockReorder,
    clearCart: orders.mockClearCart
  }]
}))

vi.mock('../../../contexts/ConfigContext', () => ({
  useConfig: () => [{ configs: orders.mockConfigState }]
}))

vi.mock('../../../contexts/ApiContext', () => ({
  useApi: () => [orders.mockOrdering]
}))

vi.mock('../../../contexts/WebsocketContext', () => ({
  useWebsocket: () => orders.mockSocket
}))

import { OrderChange } from '../index'

describe('OrderChange', () => {
  beforeEach(() => orders.reset())

  it('accepts an order as business with prepared time', async () => {
    renderController(OrderChange, { orderId: 101 })
    await act(async () => {
      await lastControllerProps.updateStateOrder({
        action: 'acceptByBusiness',
        orderId: 101,
        hour: 0,
        min: 15
      })
    })
    expect(orders.mockOrderSave).toHaveBeenCalledWith({ prepared_in: 15, status: 7 })
    expect(lastControllerProps.orderState.order.status).toBe(7)
  })

  it('rejects an order as driver with comment', async () => {
    orders.mockOrderSave.mockResolvedValueOnce({
      content: { error: true, result: ['Rejected'] }
    })
    renderController(OrderChange, { orderId: 101 })
    await act(async () => {
      await lastControllerProps.updateStateOrder({
        action: 'rejectByDriver',
        orderId: 101,
        comments: 'Too far'
      })
    })
    expect(orders.mockOrderSave).toHaveBeenCalledWith({ comment: 'Too far', status: 6 })
    expect(lastControllerProps.orderState.error).toBeTruthy()
  })
})
