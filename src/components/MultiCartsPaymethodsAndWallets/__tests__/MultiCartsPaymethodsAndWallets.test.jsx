import { describe, it, expect, vi, beforeEach } from 'vitest'
import { waitFor } from '@testing-library/react'
import { renderController, lastControllerProps } from '../../../__tests__/helpers/renderController'

const cart = vi.hoisted(() => {
  const { createCartCheckoutTestContext } = require('../../../__tests__/helpers/cartCheckoutTestHelpers')
  return createCartCheckoutTestContext(vi)
})

vi.mock('../../../contexts/SessionContext', () => ({
  useSession: () => [{
    auth: true,
    user: { id: 8 },
    token: 'session-tok'
  }]
}))

vi.mock('../../../contexts/OrderContext', () => ({
  useOrder: () => [cart.mockOrderState, {}]
}))

vi.mock('../../../contexts/ApiContext', () => ({
  useApi: () => [cart.mockOrdering]
}))

vi.mock('../../../contexts/WebsocketContext', () => ({
  useWebsocket: () => ({ getId: () => 'socket-14' })
}))

import { MultiCartsPaymethodsAndWallets } from '../index'

describe('MultiCartsPaymethodsAndWallets', () => {
  const openCarts = [
    { uuid: 'cart-uuid-5', business_id: 5 },
    { uuid: 'cart-uuid-6', business_id: 6 }
  ]

  beforeEach(() => cart.reset())

  it('loads paymethods and wallets for open carts', async () => {
    renderController(MultiCartsPaymethodsAndWallets, {
      openCarts,
      cartUuid: 'group-uuid-1',
      loyaltyPlansState: { loading: false, result: [] }
    })
    await waitFor(() => {
      expect(lastControllerProps.paymethodsAndWallets.loading).toBe(false)
    })
    expect(lastControllerProps.paymethodsAndWallets.paymethods).toHaveLength(1)
    expect(lastControllerProps.businessIds).toEqual([5, 6])
  })

  it('loads user wallets with cash redemption rate', async () => {
    renderController(MultiCartsPaymethodsAndWallets, {
      openCarts,
      cartUuid: 'group-uuid-1',
      loyaltyPlansState: { loading: false, result: [] }
    })
    await waitFor(() => {
      expect(lastControllerProps.walletsState.loading).toBe(false)
    })
    expect(lastControllerProps.walletsState.result[0].valid).toBe(true)
    expect(lastControllerProps.walletsState.result[0].redemption_rate).toBe(100)
  })
})
