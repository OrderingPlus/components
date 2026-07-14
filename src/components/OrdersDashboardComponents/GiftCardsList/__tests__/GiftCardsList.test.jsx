import { describe, it, expect, vi, beforeEach } from 'vitest'
import { waitFor, act } from '@testing-library/react'
import { renderController, lastControllerProps } from '../../../../__tests__/helpers/renderController'

const d3 = vi.hoisted(() => {
  const { createDashboardBusinessTestContext } = require('../../../../__tests__/helpers/dashboardBusinessTestHelpers')
  return createDashboardBusinessTestContext(vi)
})

vi.mock('../../../../contexts/SessionContext', () => ({
  useSession: () => [d3.mockSessionState, { changeUser: vi.fn() }]
}))

import { GiftCardsList } from '../index'

describe('GiftCardsList', () => {
  beforeEach(() => d3.reset())

  it('loads gift cards on mount', async () => {
    renderController(GiftCardsList, {})
    await waitFor(() => {
      expect(lastControllerProps.giftCards.loading).toBe(false)
    })
    expect(lastControllerProps.giftCards.list).toHaveLength(1)
  })

  it('changes active status and refetches', async () => {
    renderController(GiftCardsList, {})
    await waitFor(() => expect(lastControllerProps.giftCards.list).toHaveLength(1))
    act(() => {
      lastControllerProps.setActiveStatus('redeemed')
    })
    await waitFor(() => {
      const giftCardFetch = global.fetch.mock.calls.filter(([url]) => url.includes('/gift_cards'))
      expect(giftCardFetch.length).toBeGreaterThan(1)
    })
  })

  it('searches gift cards by id', async () => {
    renderController(GiftCardsList, { isSearchById: true })
    await waitFor(() => expect(lastControllerProps.giftCards.loading).toBe(false))
    act(() => {
      lastControllerProps.onSearch('1')
    })
    await waitFor(() => {
      const lastCall = global.fetch.mock.calls.filter(([url]) => url.includes('/gift_cards')).pop()
      expect(lastCall?.[0]).toContain('where=')
    })
  })
})
