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

import { PaymentOptionStripeDirect } from '../index'

describe('PaymentOptionStripeDirect', () => {
  beforeEach(() => pay.reset())

  it('loads stripe publishable key and client secret', async () => {
    renderController(PaymentOptionStripeDirect, {})
    await waitFor(() => {
      expect(lastControllerProps.stripeKey).toBe('pk_live_test')
    })
    expect(lastControllerProps.clientSecret).toEqual({ client_secret: 'sec_test' })
  })
})
