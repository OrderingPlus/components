import { describe, it, expect, vi, beforeEach } from 'vitest'
import { waitFor } from '@testing-library/react'
import { renderController, lastControllerProps } from '../../../__tests__/helpers/renderController'

const pay = vi.hoisted(() => {
  const { createPaymentTestContext } = require('../../../__tests__/helpers/paymentTestHelpers')
  return createPaymentTestContext(vi)
})

vi.mock('../../../contexts/ToastContext', () => ({
  useToast: () => [[], { showToast: pay.mockShowToast }],
  ToastType: { error: 'error', success: 'success', info: 'info' }
}))

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

import { PaymentOptionStripeLink } from '../index'

describe('PaymentOptionStripeLink', () => {
  beforeEach(() => pay.reset())

  it('stores payment URL and sends stripe link SMS', async () => {
    renderController(PaymentOptionStripeLink, {
      paymentURL: 'https://pay.test/link',
      cartTotal: 42
    })
    await waitFor(() => {
      expect(lastControllerProps.stripeLinkState.paymentURL).toBe('https://pay.test/link')
    })
    lastControllerProps.handleChangeUserInfo({
      name: 'Ada',
      lastname: 'Lovelace',
      country_phone_code: '+1',
      cellphone: '5551234'
    })
    await lastControllerProps.handleSendStripeLink('sms')
    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.test/text_messages/send',
      expect.objectContaining({ method: 'POST' })
    )
    expect(pay.mockShowToast).toHaveBeenCalled()
  })
})
