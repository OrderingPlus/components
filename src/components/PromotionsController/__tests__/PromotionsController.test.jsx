import { describe, it, expect, vi, beforeEach } from 'vitest'
import { waitFor, act } from '@testing-library/react'
import { renderController, lastControllerProps } from '../../../__tests__/helpers/renderController'

const acms = vi.hoisted(() => {
  const { createAnalyticsCmsTestContext } = require('../../../__tests__/helpers/analyticsCmsTestHelpers')
  return createAnalyticsCmsTestContext(vi)
})

vi.mock('../../../contexts/SessionContext', () => ({
  useSession: () => [{
    auth: true,
    loading: false,
    user: { id: 8, name: 'Test', last_name: 'User' },
    token: 'session-tok'
  }]
}))

vi.mock('../../../contexts/ApiContext', () => ({
  useApi: () => [acms.mockOrdering]
}))

import { PromotionsController } from '../index'

describe('PromotionsController', () => {
  beforeEach(() => acms.reset())

  it('loads public offers on mount', async () => {
    renderController(PromotionsController, {})
    await waitFor(() => {
      expect(lastControllerProps.offersState.loading).toBe(false)
    })
    expect(lastControllerProps.offersState.offers).toHaveLength(1)
  })

  it('filters offers by business slug and supports search state', async () => {
    renderController(PromotionsController, { businessSlug: 'pizza-place' })
    await waitFor(() => expect(lastControllerProps.offersState.offers).toHaveLength(1))
    act(() => {
      lastControllerProps.handleSearchValue('10%')
      lastControllerProps.setOfferSelected(1)
    })
    expect(lastControllerProps.searchValue).toBe('10%')
    expect(lastControllerProps.offerSelected).toBe(1)
  })
})
