import { describe, it, expect, vi, beforeEach } from 'vitest'
import { waitFor } from '@testing-library/react'
import { renderController, lastControllerProps } from '../../../../__tests__/helpers/renderController'

const upm = vi.hoisted(() => {
  const { createUserProjectMiscTestContext } = require('../../../../__tests__/helpers/userProjectMiscTestHelpers')
  return createUserProjectMiscTestContext(vi)
})

vi.mock('../../../../contexts/SessionContext', () => ({
  useSession: () => [{
    auth: true,
    loading: false,
    user: upm.sampleUser,
    token: 'session-tok'
  }]
}))

vi.mock('../../../../contexts/ApiContext', () => ({
  useApi: () => [upm.mockOrdering, { setOrdering: upm.mockSetOrdering }]
}))

import { GiftCardOrdersList } from '../index'

describe('GiftCardOrdersList', () => {
  beforeEach(() => upm.reset())

  it('loads gift cards on mount', async () => {
    renderController(GiftCardOrdersList, {})
    await waitFor(() => {
      expect(lastControllerProps.giftCards.loading).toBe(false)
    })
    expect(lastControllerProps.giftCards.list).toHaveLength(1)
  })

  it('refreshes when refreshOrders flag is set', async () => {
    renderController(GiftCardOrdersList, {
      refreshOrders: true,
      setRefreshOrders: upm.mockSetRefreshOrders
    })
    await waitFor(() => expect(lastControllerProps.giftCards.list).toHaveLength(1))
    expect(upm.mockSetRefreshOrders).toHaveBeenCalledWith(false)
  })
})
