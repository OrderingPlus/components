import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, waitFor, act } from '@testing-library/react'
import { EventProvider } from '../../../contexts/EventContext'

const acms = vi.hoisted(() => {
  const { createAnalyticsCmsTestContext } = require('../../../__tests__/helpers/analyticsCmsTestHelpers')
  return createAnalyticsCmsTestContext(vi)
})

vi.mock('@segment/analytics-next', () => ({
  AnalyticsBrowser: {
    load: vi.fn(() => Promise.resolve([{
      track: acms.mockTrack,
      identify: acms.mockIdentify
    }]))
  }
}))

vi.mock('../../../contexts/EventContext', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    useEvent: () => [{ emit: acms.mockEmit, on: acms.mockEventsOn, off: acms.mockEventsOff }]
  }
})

import { AnalyticsSegment } from '../index'

const renderWithEvents = (ui) => render(<EventProvider>{ui}</EventProvider>)

describe('AnalyticsSegment', () => {
  let getLatestHandler

  beforeEach(() => {
    acms.reset()
    getLatestHandler = acms.getLatestHandler()
  })

  it('tracks product and order events after analytics loads', async () => {
    renderWithEvents(
      <AnalyticsSegment writeKey='segment-key'>
        <div data-testid='segment-child' />
      </AnalyticsSegment>
    )
    await waitFor(() => expect(acms.mockEventsOn).toHaveBeenCalledWith('product_clicked', expect.any(Function)))

    const product = { id: 1, name: 'Burger', category_id: 2, price: 9, quantity: 1 }
    act(() => {
      getLatestHandler('product_clicked')?.(product)
      getLatestHandler('product_added')?.(product)
      getLatestHandler('cart_product_removed')?.(product)
      getLatestHandler('userLogin')?.({ id: 8, email: 'a@test.com', name: 'Test' })
      getLatestHandler('change_view')?.({ page: 'home' })
      getLatestHandler('order_placed')?.({
        id: 101,
        total: 25,
        tax_total: 2,
        delivery_zone_price: 3,
        business: { name: 'Pizza' },
        business_id: 5,
        paymethod: { id: 1 }
      })
      getLatestHandler('order_updated')?.({ id: 101, total: 26, tax_total: 2, delivery_zone_price: 3, business: { name: 'Pizza' } })
      getLatestHandler('order_added')?.({ id: 102, total: 15, tax_total: 1, delivery_zone_price: 2, business: { name: 'Cafe' } })
    })

    expect(acms.mockTrack).toHaveBeenCalled()
    expect(acms.mockIdentify).toHaveBeenCalledWith(8, expect.objectContaining({ email: 'a@test.com' }))
  })
})
