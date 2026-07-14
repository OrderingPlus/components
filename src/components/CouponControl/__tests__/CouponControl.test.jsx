import { describe, it, expect, vi, beforeEach } from 'vitest'
import { waitFor } from '@testing-library/react'
import { renderController, lastControllerProps } from '../../../__tests__/helpers/renderController'

const cart = vi.hoisted(() => {
  const { createCartCheckoutTestContext } = require('../../../__tests__/helpers/cartCheckoutTestHelpers')
  return createCartCheckoutTestContext(vi)
})

vi.mock('../../../contexts/LanguageContext', () => ({
  useLanguage: () => [{ loading: false, language: { code: 'en' } }, (key, fallback) => fallback || key]
}))

vi.mock('../../../contexts/CustomerContext', () => ({
  useCustomer: () => [{ user: { id: 12 } }]
}))

vi.mock('../../../contexts/ConfigContext', () => ({
  useConfig: () => [cart.mockConfigState, { refreshConfigs: vi.fn() }]
}))

vi.mock('../../../contexts/OrderContext', () => ({
  useOrder: () => [cart.mockOrderState, {
    applyCoupon: cart.mockApplyCoupon,
    applyOffer: cart.mockApplyOffer
  }]
}))

import { CouponControl } from '../index'

describe('CouponControl', () => {
  beforeEach(() => cart.reset())

  it('exposes coupon from cart state', () => {
    renderController(CouponControl, { businessId: 5, price: 10 })
    expect(lastControllerProps.couponDefault).toEqual({ code: 'SAVE10' })
  })

  it('removes coupon from cart', () => {
    renderController(CouponControl, { businessId: 5, price: 10 })
    lastControllerProps.handleRemoveCouponClick()
    expect(cart.mockApplyCoupon).toHaveBeenCalledWith({ business_id: 5, coupon: null })
  })

  it('applies offers when advanced offers module is enabled', () => {
    cart.mockConfigState.configs.advanced_offers_module.value = '1'
    renderController(CouponControl, { businessId: 5, price: 10 })
    lastControllerProps.handleButtonApplyClick()
    expect(cart.mockApplyOffer).toHaveBeenCalledWith(expect.objectContaining({
      business_id: 5,
      force: true,
      userId: 12
    }))
  })

  it('opens confirm dialog when discounted price is negative', async () => {
    renderController(CouponControl, { businessId: 5, price: -1 })
    await waitFor(() => {
      expect(lastControllerProps.confirm.open).toBe(true)
    })
    expect(cart.mockApplyCoupon).toHaveBeenCalledWith({ business_id: 5, coupon: null })
  })
})
