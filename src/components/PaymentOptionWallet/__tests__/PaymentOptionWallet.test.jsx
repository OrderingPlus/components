import { describe, it, expect, vi, beforeEach } from 'vitest'
import { waitFor } from '@testing-library/react'
import { renderController, lastControllerProps } from '../../../__tests__/helpers/renderController'

const pay = vi.hoisted(() => {
  const { createPaymentTestContext } = require('../../../__tests__/helpers/paymentTestHelpers')
  return createPaymentTestContext(vi)
})

vi.mock('../../../contexts/SessionContext', () => ({
  useSession: () => [{
    auth: true,
    loading: false,
    user: { id: 8, name: 'Test User' },
    token: 'session-tok',
    device_code: null
  }]
}))

vi.mock('../../../contexts/OrderContext', () => ({
  useOrder: () => [pay.mockOrderState, {
    setStateValues: pay.mockSetStateValues
  }]
}))

vi.mock('../../../contexts/ApiContext', () => ({
  useApi: () => [pay.mockOrdering]
}))

vi.mock('../../../contexts/WebsocketContext', () => ({
  useWebsocket: () => ({ getId: () => 'socket-15' })
}))

import { PaymentOptionWallet } from '../index'

describe('PaymentOptionWallet', () => {
  const cart = { business_id: 5, uuid: 'cart-uuid-5' }

  beforeEach(() => pay.reset())

  it('loads wallets with cash redemption rate', async () => {
    renderController(PaymentOptionWallet, {
      cart,
      loyaltyPlansState: { loading: false, result: [] }
    })
    await waitFor(() => {
      expect(lastControllerProps.walletsState.loading).toBe(false)
    })
    expect(lastControllerProps.walletsState.result[0].redemption_rate).toBe(100)
  })

  it('applies and removes wallet on cart', async () => {
    renderController(PaymentOptionWallet, {
      cart,
      loyaltyPlansState: { loading: false, result: [] }
    })
    await waitFor(() => expect(lastControllerProps.walletsState.result).toHaveLength(1))
    await lastControllerProps.selectWallet({ id: 3 })
    await waitFor(() => {
      expect(lastControllerProps.loading).toBe(false)
    })
    expect(pay.mockSetStateValues).toHaveBeenCalled()
    await lastControllerProps.deletetWalletSelected({ id: 3 })
    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.test/carts/cart-uuid-5/wallets/3',
      expect.objectContaining({ method: 'DELETE' })
    )
  })
})
