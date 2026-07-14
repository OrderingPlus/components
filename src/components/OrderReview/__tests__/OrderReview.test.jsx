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

import { OrderReview } from '../index'

describe('OrderReview', () => {
  const reviewOrder = {
    id: 101,
    business_id: 5,
    business: { length: 1 }
  }

  beforeEach(() => orders.reset())

  it('updates star ratings and comments', async () => {
    renderController(OrderReview, { order: reviewOrder, isToast: false, defaultStar: 5 })
    act(() => {
      lastControllerProps.handleChangeRating({ target: { name: 'quality', value: 4 } })
    })
    await waitFor(() => {
      expect(lastControllerProps.stars.quality).toBe(4)
    })
    act(() => {
      lastControllerProps.handleChangeInput({ target: { value: 'Great food' } })
    })
    await waitFor(() => {
      expect(lastControllerProps.stars.comments).toBe('Great food')
    })
  })

  it('submits a review to the API', async () => {
    renderController(OrderReview, {
      order: reviewOrder,
      isToast: true,
      onSaveReview: orders.mockOnSaveReview,
      handleUpdateOrderList: orders.mockHandleUpdateOrderList
    })
    await act(async () => {
      await lastControllerProps.handleSendReview()
    })
    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.test/business/5/reviews',
      expect.objectContaining({ method: 'POST' })
    )
    expect(orders.mockShowToast).toHaveBeenCalled()
  })

  it('delegates to custom review handler when provided', async () => {
    const mockCustom = vi.fn()
    renderController(OrderReview, {
      order: reviewOrder,
      handleCustomSendReview: mockCustom
    })
    await act(async () => {
      await lastControllerProps.handleSendReview()
    })
    expect(mockCustom).toHaveBeenCalledWith(lastControllerProps.stars)
  })
})
