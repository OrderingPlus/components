import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, waitFor, act } from '@testing-library/react'
import { EventProvider } from '../../../contexts/EventContext'

const acms = vi.hoisted(() => {
  const { createAnalyticsCmsTestContext } = require('../../../__tests__/helpers/analyticsCmsTestHelpers')
  return createAnalyticsCmsTestContext(vi)
})

vi.mock('../../../contexts/EventContext', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    useEvent: () => [{ emit: acms.mockEmit, on: acms.mockEventsOn, off: acms.mockEventsOff }]
  }
})

import { FacebookPixel } from '../index'

const renderWithEvents = (ui) => render(<EventProvider>{ui}</EventProvider>)

describe('FacebookPixel', () => {
  let getLatestHandler

  beforeEach(() => {
    acms.reset()
    getLatestHandler = acms.getLatestHandler()
  })

  it('initializes pixel and tracks commerce events', async () => {
    renderWithEvents(
      <FacebookPixel trackId='pixel-123'>
        <div data-testid='pixel-child' />
      </FacebookPixel>
    )
    await waitFor(() => expect(acms.mockEventsOn).toHaveBeenCalledWith('product_added', expect.any(Function)))

    const product = { id: 1, name: 'Burger', category: { name: 'Food' }, price: 9, quantity: 1 }
    act(() => {
      getLatestHandler('product_added')?.(product)
      getLatestHandler('product_edited')?.(product)
      getLatestHandler('order_placed')?.({ id: 101, total: 25 })
      getLatestHandler('userLogin')?.({ id: 8, name: 'Test', last_name: 'User' })
      getLatestHandler('singup_user')?.({ id: 9, name: 'New', last_name: 'User' })
      getLatestHandler('add_payment_option')?.({ gateway: 'stripe', id: 3 })
      getLatestHandler('change_view')?.({ page: 'checkout', params: { id: 1 } })
    })

    expect(acms.mockFbq).toHaveBeenCalled()
  })
})
