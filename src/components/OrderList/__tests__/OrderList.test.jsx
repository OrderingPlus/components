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

import { OrderList } from '../index'

describe('OrderList', () => {
  beforeEach(() => orders.reset())

  it('uses customArray orders without fetching', () => {
    renderController(OrderList, {
      customArray: [orders.sampleOrder],
      isCustomerMode: true
    })
    expect(lastControllerProps.orderList.orders).toHaveLength(1)
    expect(lastControllerProps.orderList.loading).toBe(false)
  })

  it('updates a single order in the list', async () => {
    renderController(OrderList, {
      customArray: [orders.sampleOrder],
      isCustomerMode: true
    })
    act(() => {
      lastControllerProps.handleUpdateOrderList(101, { status: 3 })
    })
    await waitFor(() => {
      expect(lastControllerProps.orderList.orders[0].status).toBe(3)
    })
  })

  it('sorts orders by id', () => {
    renderController(OrderList, {
      customArray: [orders.sampleOrder, orders.completedOrder],
      isCustomerMode: true
    })
    const sorted = lastControllerProps.sortOrders(
      [{ id: 1 }, { id: 3 }, { id: 2 }],
      'desc'
    )
    expect(sorted.map(o => o.id)).toEqual([3, 2, 1])
  })

  it('reorders and redirects to checkout', async () => {
    renderController(OrderList, {
      customArray: [orders.sampleOrder],
      isCustomerMode: true,
      handleRedirectToCheckout: orders.mockHandleRedirectToCheckout
    })
    await act(async () => {
      await lastControllerProps.handleReorder(101)
    })
    expect(orders.mockReorder).toHaveBeenCalled()
    expect(orders.mockHandleRedirectToCheckout).toHaveBeenCalledWith('cart-uuid-5')
  })

  it('fetches orders from API when no list prop is passed', async () => {
    renderController(OrderList, { isCustomerMode: true })
    await waitFor(() => {
      expect(lastControllerProps.orderList.loading).toBe(false)
    })
    expect(lastControllerProps.orderList.orders.length).toBeGreaterThan(0)
    expect(orders.mockOrdersGet).toHaveBeenCalled()
  })

  it('loads dashboard messages for an order', async () => {
    renderController(OrderList, { customArray: [orders.sampleOrder], isCustomerMode: true })
    await act(async () => {
      await lastControllerProps.loadMessages(101)
    })
    await waitFor(() => {
      expect(lastControllerProps.messages.messages).toHaveLength(1)
    })
  })

  it('paginates with goToPage', async () => {
    renderController(OrderList, { isCustomerMode: true })
    await waitFor(() => expect(lastControllerProps.orderList.loading).toBe(false))
    await act(async () => {
      await lastControllerProps.goToPage(2)
    })
    expect(orders.mockOrdersGet).toHaveBeenCalled()
  })

  it('loads businesses when isBusiness is enabled', async () => {
    renderController(OrderList, { isBusiness: true, isCustomerMode: true })
    await waitFor(() => {
      expect(lastControllerProps.orderList.loading).toBe(false)
    })
    await waitFor(() => {
      expect(lastControllerProps.businesses.loading).toBe(false)
    })
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/businesses?'),
      expect.any(Object)
    )
  })

  it('clears cart before reorder from handleRemoveCart', async () => {
    renderController(OrderList, {
      customArray: [orders.sampleOrder],
      isCustomerMode: true
    })
    await act(async () => {
      await lastControllerProps.handleRemoveCart(orders.sampleOrder)
    })
    expect(orders.mockClearCart).toHaveBeenCalled()
    expect(orders.mockReorder).toHaveBeenCalled()
  })

  it('fetches with order id and status filters', async () => {
    renderController(OrderList, {
      orderIds: [101],
      orderStatus: [0, 3],
      isCustomerMode: true,
      isGetOrdersFromHome: true
    })
    await waitFor(() => {
      expect(lastControllerProps.orderList.loading).toBe(false)
    })
    expect(orders.mockOrdersGet).toHaveBeenCalled()
  })

  it('loads more orders through infinity pagination', async () => {
    renderController(OrderList, {
      isCustomerMode: true,
      paginationSettings: { pageSize: 10, controlType: 'infinity' }
    })
    await waitFor(() => expect(lastControllerProps.orderList.loading).toBe(false))
    await act(async () => {
      await lastControllerProps.loadMoreOrders()
    })
    expect(orders.mockOrdersGet).toHaveBeenCalled()
  })

  it('updates orders from websocket when not in customer mode', async () => {
    renderController(OrderList, {
      customArray: [orders.sampleOrder],
      isCustomerMode: false,
      orderStatus: [0, 3]
    })
    await waitFor(() => expect(lastControllerProps.orderList.loading).toBe(false))
    const updateHandler = orders.mockSocket.on.mock.calls.find(([event]) => event === 'update_order')?.[1]
    act(() => {
      updateHandler?.({ ...orders.sampleOrder, status: 3 })
    })
    expect(orders.mockShowToast).toHaveBeenCalled()
  })

  it('clears unread count when order_message_read fires', async () => {
    renderController(OrderList, {
      customArray: [{ ...orders.sampleOrder, unread_count: 2 }],
      isCustomerMode: true
    })
    await waitFor(() => {
      expect(lastControllerProps.orderList.orders[0]?.unread_count).toBe(2)
    })
    const readHandlers = orders.mockEventsOn.mock.calls.filter(([event]) => event === 'order_message_read')
    const readHandler = readHandlers[readHandlers.length - 1]?.[1]
    act(() => {
      readHandler?.(101)
    })
    await waitFor(() => {
      expect(lastControllerProps.orderList.orders[0].unread_count).toBe(0)
    })
  })
})
