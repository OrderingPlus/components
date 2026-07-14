import { describe, it, expect, vi, beforeEach } from 'vitest'
import { waitFor } from '@testing-library/react'
import { renderController, lastControllerProps } from '../../../__tests__/helpers/renderController'

const pay = vi.hoisted(() => {
  const { createPaymentTestContext } = require('../../../__tests__/helpers/paymentTestHelpers')
  return createPaymentTestContext(vi)
})

vi.mock('../../../contexts/ApiContext', () => ({
  useApi: () => [pay.mockOrdering]
}))

import { PaymethodList } from '../index'

describe('PaymethodList', () => {
  beforeEach(() => pay.reset())

  it('uses provided paymethods without fetching', () => {
    const paymethods = [{ id: 1, gateway: 'cash' }]
    renderController(PaymethodList, { paymethods })
    expect(lastControllerProps.paymethodList.paymethods).toEqual(paymethods)
    expect(lastControllerProps.paymethodList.loading).toBe(false)
  })

  it('fetches paymethods from API when prop is omitted', async () => {
    renderController(PaymethodList, {})
    await waitFor(() => {
      expect(lastControllerProps.paymethodList.loading).toBe(false)
    })
    expect(lastControllerProps.paymethodList.paymethods).toHaveLength(1)
  })
})
