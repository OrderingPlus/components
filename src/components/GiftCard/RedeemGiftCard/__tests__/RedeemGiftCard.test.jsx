import { describe, it, expect, vi, beforeEach } from 'vitest'
import { act } from '@testing-library/react'
import { renderController, lastControllerProps } from '../../../../__tests__/helpers/renderController'

const upm = vi.hoisted(() => {
  const { createUserProjectMiscTestContext } = require('../../../../__tests__/helpers/userProjectMiscTestHelpers')
  return createUserProjectMiscTestContext(vi)
})

vi.mock('../../../../contexts/EventContext', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    useEvent: () => [{ emit: upm.mockEmit }]
  }
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

import { RedeemGiftCard } from '../index'

describe('RedeemGiftCard', () => {
  beforeEach(() => upm.reset())

  it('applies code and emits gift_card_redeemed', async () => {
    renderController(RedeemGiftCard, {})
    await act(async () => {
      await lastControllerProps.handleApply({ code: 'GIFT-ABC' })
    })
    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.test/gift_cards/redeem',
      expect.objectContaining({ method: 'POST' })
    )
    expect(upm.mockEmit).toHaveBeenCalledWith('gift_card_redeemed')
    expect(lastControllerProps.redeemedGiftCard).toEqual({ id: 1, balance: 50 })
  })
})
