import { describe, it, expect, vi, beforeEach } from 'vitest'
import { waitFor } from '@testing-library/react'
import { renderController, lastControllerProps } from '../../../__tests__/helpers/renderController'

const detail = vi.hoisted(() => {
  const h = require('../../../__tests__/helpers/productDetailTestHelpers')
  const api = h.createProductDetailApiMocks(vi)
  const mockShowToast = vi.fn()
  const mockEmit = vi.fn()
  const reset = () => {
    vi.clearAllMocks()
    h.applyDefaultProductDetailMockImplementations(vi, api)
    h.setupProductDetailFetchMock(vi)
  }
  return {
    ...api,
    mockOrdering: h.buildProductDetailMockOrdering(vi, api),
    mockShowToast,
    mockEmit,
    reset
  }
})

vi.mock('../../../contexts/EventContext', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    useEvent: () => [{ emit: detail.mockEmit }]
  }
})

vi.mock('../../../contexts/LanguageContext', () => ({
  useLanguage: () => [{ loading: false, language: { code: 'en' } }, (key, fallback) => fallback || key]
}))

vi.mock('../../../contexts/ToastContext', () => ({
  useToast: () => [[], { showToast: detail.mockShowToast }],
  ToastType: { error: 'error', success: 'success' }
}))

vi.mock('../../../contexts/SessionContext', () => ({
  useSession: () => [{
    auth: true,
    user: { id: 8 },
    token: 'session-tok'
  }]
}))

vi.mock('../../../contexts/ApiContext', () => ({
  useApi: () => [detail.mockOrdering]
}))

vi.mock('../../../contexts/WebsocketContext', () => ({
  useWebsocket: () => ({ getId: () => 'socket-13' })
}))

import { ReviewProduct } from '../index'

describe('ReviewProduct', () => {
  beforeEach(() => detail.reset())

  it('stores review changes in form state', async () => {
    renderController(ReviewProduct, {
      order: { id: 99, products: [[{ product_id: 10, order_id: 99 }]] }
    })
    lastControllerProps.handleChangeFormState([{ product_id: 10, quality: 5 }])
    await waitFor(() => {
      expect(lastControllerProps.formState.changes).toHaveLength(1)
    })
  })

  it('submits product reviews to API', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: async () => ({ error: false, result: { success: true } })
    })
    renderController(ReviewProduct, {
      order: { id: 99, products: [[{ product_id: 10, order_id: 99 }]] },
      isToast: true
    })
    lastControllerProps.handleChangeFormState([{ product_id: 10, quality: 5, comment: 'Great' }])
    await waitFor(() => {
      expect(lastControllerProps.formState.changes).toHaveLength(1)
    })
    await lastControllerProps.handleSendProductReview()
    await waitFor(() => {
      expect(lastControllerProps.formState.loading).toBe(false)
    })
    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.test/orders/99/product_reviews',
      expect.objectContaining({ method: 'POST' })
    )
    expect(detail.mockEmit).toHaveBeenCalledWith('product_reviewed', [{ product_id: 10, quality: 5, comment: 'Great' }])
  })

  it('submits reviews for multi-business orders', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: async () => ({ error: false, result: { success: true } })
    })
    renderController(ReviewProduct, {
      order: {
        id: [101, 102],
        business: [{ id: 1 }, { id: 2 }],
        products: [
          [{ product_id: 10, order_id: 101 }],
          [{ product_id: 20, order_id: 102 }]
        ]
      }
    })
    lastControllerProps.handleChangeFormState([
      { product_id: 10, quality: 4 },
      { product_id: 20, quality: 5 }
    ])
    await waitFor(() => expect(lastControllerProps.formState.changes).toHaveLength(2))
    await lastControllerProps.handleSendProductReview()
    await waitFor(() => expect(lastControllerProps.formState.loading).toBe(false))
    expect(global.fetch).toHaveBeenCalled()
  })

  it('marks form state as errored when review API fails', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: async () => ({ error: true, result: 'Review failed' })
    })
    renderController(ReviewProduct, {
      order: { id: 99, products: [[{ product_id: 10, order_id: 99 }]] }
    })
    lastControllerProps.handleChangeFormState([{ product_id: 10, quality: 2 }])
    await waitFor(() => expect(lastControllerProps.formState.changes).toHaveLength(1))
    await lastControllerProps.handleSendProductReview()
    await waitFor(() => {
      expect(lastControllerProps.formState.result.error).toBe(true)
    })
  })
})
