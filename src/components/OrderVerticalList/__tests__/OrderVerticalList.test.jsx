import { describe, it, expect, vi, beforeEach } from 'vitest'
import { waitFor, act } from '@testing-library/react'
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

import { OrderVerticalList } from '../index'

describe('OrderVerticalList', () => {
  beforeEach(() => orders.reset())

  it('loads orders into status tabs', async () => {
    renderController(OrderVerticalList, { businessId: 5 })
    await waitFor(() => {
      expect(lastControllerProps.ordersGroup.loading).toBe(false)
    })
    expect(lastControllerProps.ordersGroup.active.orders.length).toBeGreaterThan(0)
    expect(lastControllerProps.ordersGroup.past.orders.length).toBeGreaterThan(0)
  })

  it('reorders and navigates to checkout', async () => {
    orders.mockReorder.mockResolvedValueOnce({
      error: false,
      result: { uuid: 'cart-uuid-5' }
    })
    renderController(OrderVerticalList, {
      onNavigationRedirect: orders.mockOnNavigationRedirect
    })
    await waitFor(() => expect(lastControllerProps.ordersGroup.loading).toBe(false))
    await act(async () => {
      await lastControllerProps.handleReorder(101)
    })
    expect(orders.mockOnNavigationRedirect).toHaveBeenCalledWith('CheckoutNavigator', { cartUuid: 'cart-uuid-5' })
  })

  it('loads more orders', async () => {
    renderController(OrderVerticalList, {})
    await waitFor(() => expect(lastControllerProps.ordersGroup.loading).toBe(false))
    await act(async () => {
      await lastControllerProps.loadMoreOrders()
    })
    expect(orders.mockOrdersGet).toHaveBeenCalled()
  })

  it('adds orders from websocket register event', async () => {
    renderController(OrderVerticalList, {})
    await waitFor(() => expect(lastControllerProps.ordersGroup.loading).toBe(false))
    const registerHandler = orders.mockSocket.on.mock.calls.find(([event]) => event === 'orders_register')?.[1]
    const fullOrder = {
      ...orders.sampleOrder,
      status: 0,
      summary: { total: 25 },
      customer: { id: 8 },
      business: { id: 5 },
      paymethod: { id: 1 }
    }
    act(() => {
      registerHandler?.(fullOrder)
    })
    expect(orders.mockEmit).toHaveBeenCalledWith('order_added', fullOrder)
  })

  it('updates tabs from websocket events', async () => {
    renderController(OrderVerticalList, {})
    await waitFor(() => expect(lastControllerProps.ordersGroup.loading).toBe(false))
    const updateHandler = orders.mockSocket.on.mock.calls.find(([event]) => event === 'update_order')?.[1]
    act(() => {
      updateHandler?.({
        ...orders.sampleOrder,
        status: 3,
        summary: { total: 25 },
        customer: { id: 8 },
        business: { id: 5 },
        paymethod: { id: 1 }
      })
    })
    expect(orders.mockShowToast).toHaveBeenCalled()
  })
})
