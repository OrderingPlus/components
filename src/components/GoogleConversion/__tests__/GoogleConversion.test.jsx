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

vi.mock('../../../contexts/SessionContext', () => ({
  useSession: () => [{
    auth: true,
    loading: false,
    user: { id: 8, name: 'Test', last_name: 'User' },
    token: 'session-tok'
  }]
}))

import { GoogleConversion } from '../index'

const renderWithEvents = (ui) => render(<EventProvider>{ui}</EventProvider>)

describe('GoogleConversion', () => {
  let getLatestHandler

  beforeEach(() => {
    acms.reset()
    getLatestHandler = acms.getLatestHandler()
  })

  it('persists rwg_token from URL and posts conversion on order_placed', async () => {
    sessionStorage.setItem('google_rwg_token', 'token-xyz')
    sessionStorage.setItem('google_rwg_redirect_business_id', '5')

    renderWithEvents(
      <GoogleConversion projectCode='demo-project'>
        <div data-testid='conversion-child' />
      </GoogleConversion>
    )

    await waitFor(() => expect(acms.mockEventsOn).toHaveBeenCalledWith('order_placed', expect.any(Function)))
    await waitFor(() => expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/frontend/settings'),
      expect.any(Object)
    ))

    await act(async () => {
      await getLatestHandler('order_placed')?.({ id: 101, business_id: 5 })
    })

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/google/conversions/order-completed'),
      expect.objectContaining({ method: 'POST' })
    )
    expect(sessionStorage.getItem('google_rwg_token')).toBeNull()
  })
})
