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

import { SingleOrderCard } from '../index'

describe('SingleOrderCard', () => {
  beforeEach(() => orders.reset())

  it('adds order to favorites', async () => {
    renderController(SingleOrderCard, {
      order: orders.sampleOrder,
      handleUpdateOrderList: orders.mockHandleUpdateOrderList
    })
    await act(async () => {
      await lastControllerProps.handleFavoriteOrder(true)
    })
    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.test/users/8/favorite_orders',
      expect.objectContaining({ method: 'POST' })
    )
    expect(orders.mockHandleUpdateOrderList).toHaveBeenCalledWith(101, { favorite: true })
  })

  it('removes order from favorites', async () => {
    renderController(SingleOrderCard, {
      order: orders.sampleOrder,
      handleUpdateSingleOrder: orders.mockHandleUpdateSingleOrder
    })
    await act(async () => {
      await lastControllerProps.handleFavoriteOrder(false)
    })
    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.test/users/8/favorite_orders/101',
      expect.objectContaining({ method: 'DELETE' })
    )
  })

  it('clears cart before reordering', async () => {
    renderController(SingleOrderCard, {
      order: orders.sampleOrder,
      handleReorder: orders.mockHandleReorder
    })
    await act(async () => {
      await lastControllerProps.handleRemoveCart(orders.sampleOrder)
    })
    expect(orders.mockClearCart).toHaveBeenCalledWith('cart-uuid-5', expect.any(Object))
    expect(orders.mockHandleReorder).toHaveBeenCalledWith([101])
  })
})
