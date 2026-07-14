import { describe, it, expect, vi, beforeEach } from 'vitest'
import { waitFor } from '@testing-library/react'
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

import { MultiOrdersDetails } from '../index'

describe('MultiOrdersDetails', () => {
  beforeEach(() => orders.reset())

  it('redirects when order group id is missing', () => {
    renderController(MultiOrdersDetails, { onRedirectPage: orders.mockOnRedirectPage })
    expect(orders.mockOnRedirectPage).toHaveBeenCalled()
  })

  it('loads cart group orders and builds summary', async () => {
    renderController(MultiOrdersDetails, { orderId: 55 })
    await waitFor(() => {
      expect(lastControllerProps.ordersList.loading).toBe(false)
    })
    expect(lastControllerProps.ordersList.orders).toHaveLength(2)
    expect(lastControllerProps.ordersSummary.total).toBe(50)
    expect(lastControllerProps.ordersSummary.subtotal).toBe(40)
  })
})
