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

vi.mock('../../../contexts/ApiContext', () => ({
  useApi: () => [pay.mockOrdering]
}))

vi.mock('../../../contexts/WebsocketContext', () => ({
  useWebsocket: () => ({ getId: () => 'socket-15' })
}))

import { PaymentOptionStripeRedirect } from '../index'

describe('PaymentOptionStripeRedirect', () => {
  beforeEach(() => pay.reset())

  it('builds modal label and loads stripe key', async () => {
    renderController(PaymentOptionStripeRedirect, {
      businessId: 5,
      currency: 'USD',
      paymentMethods: [{ name: 'Card' }, { name: 'Apple Pay' }]
    })
    await waitFor(() => {
      expect(lastControllerProps.stripePK).toBe('pk_live_test')
    })
    expect(lastControllerProps.modalName).toBe('Card, Apple Pay')
  })
})
