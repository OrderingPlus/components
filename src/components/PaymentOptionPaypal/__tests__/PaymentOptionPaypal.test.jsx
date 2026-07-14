import { describe, it, expect, vi, beforeEach } from 'vitest'
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

import { PaymentOptionPaypal } from '../index'

describe('PaymentOptionPaypal', () => {
  beforeEach(() => pay.reset())

  it('exposes paypal callbacks that place and confirm the cart', async () => {
    window.paypal = {
      Buttons: {
        driver: () => () => null
      }
    }
    const handlerChangePaypal = vi.fn()
    renderController(PaymentOptionPaypal, {
      clientId: 'paypal-client',
      currency: 'USD',
      body: {
        cartUuid: 'cart-uuid-5',
        paymethod_id: 4,
        amount: 42,
        delivery_zone_id: 1
      },
      handlerChangePaypal
    })
    await waitFor(() => {
      expect(lastControllerProps.isSdkReady).toBe(true)
    })
    const reference = await lastControllerProps.paypalButtonProps.createOrder()
    expect(reference).toBe('pay-ref-1')
    expect(pay.mockPlaceCart).toHaveBeenCalled()
    await lastControllerProps.paypalButtonProps.onApprove()
    expect(pay.mockConfirmCart).toHaveBeenCalledWith('cart-uuid-5')
    expect(handlerChangePaypal).toHaveBeenCalledWith('order-uuid-1')
  })
})
