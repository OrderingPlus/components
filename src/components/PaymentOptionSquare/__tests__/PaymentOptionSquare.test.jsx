import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { waitFor } from '@testing-library/react'
import { renderController, lastControllerProps } from '../../../__tests__/helpers/renderController'

const pay = vi.hoisted(() => {
  const { createPaymentTestContext } = require('../../../__tests__/helpers/paymentTestHelpers')
  return createPaymentTestContext(vi)
})

vi.mock('../../../contexts/OrderContext', () => ({
  useOrder: () => [pay.mockOrderState, {
    placeCart: pay.mockPlaceCart,
    confirmCart: pay.mockConfirmCart
  }]
}))

import { PaymentOptionSquare } from '../index'

describe('PaymentOptionSquare', () => {
  const originalCreateElement = document.createElement.bind(document)

  beforeEach(() => pay.reset())

  afterEach(() => {
    document.createElement = originalCreateElement
    delete window.Square
  })

  it('exposes square payment methods and changes selection', async () => {
    const mockCard = {
      attach: vi.fn().mockResolvedValue(undefined),
      tokenize: vi.fn().mockResolvedValue({ status: 'OK', token: 'square-tok' })
    }
    window.Square = {
      payments: vi.fn(() => ({
        card: vi.fn().mockResolvedValue(mockCard),
        ach: vi.fn(),
        giftCard: vi.fn()
      }))
    }
    document.createElement = vi.fn((tag) => {
      const el = originalCreateElement(tag)
      if (tag === 'script') {
        queueMicrotask(() => el.onload && el.onload())
      }
      return el
    })
    document.getElementById = vi.fn((id) => {
      const el = originalCreateElement('button')
      el.id = id
      el.addEventListener = vi.fn()
      el.removeEventListener = vi.fn()
      return el
    })

    const onPlaceOrderClick = vi.fn()
    renderController(PaymentOptionSquare, {
      cartTotal: 42,
      body: {
        cartUuid: 'cart-uuid-5',
        paymethod_id: 6,
        amount: 42,
        delivery_zone_id: 0
      },
      data: { application_id: 'sq-app', location_id: 'sq-loc' },
      onPlaceOrderClick,
      setCreateOrder: vi.fn()
    })
    await waitFor(() => {
      expect(lastControllerProps.isSquareReady).toBe(true)
    })
    expect(lastControllerProps.paymentMethods).toHaveLength(3)
    lastControllerProps.handleChangeMethodSelected('card_payments')
    await waitFor(() => {
      expect(lastControllerProps.methodSelected).toBe('card_payments')
    })
  })
})
