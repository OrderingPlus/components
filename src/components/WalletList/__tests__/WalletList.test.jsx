import { describe, it, expect, vi, beforeEach } from 'vitest'
import { waitFor } from '@testing-library/react'
import { renderController, lastControllerProps } from '../../../__tests__/helpers/renderController'

const pay = vi.hoisted(() => {
  const { createPaymentTestContext } = require('../../../__tests__/helpers/paymentTestHelpers')
  return createPaymentTestContext(vi)
})

vi.mock('../../../contexts/EventContext', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    useEvent: () => [{ emit: pay.mockEmit, on: pay.mockEventsOn, off: pay.mockEventsOff }]
  }
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

import { WalletList } from '../index'

describe('WalletList', () => {
  beforeEach(() => pay.reset())

  it('loads wallets, loyalty level, and transactions', async () => {
    renderController(WalletList, {
      isWalletCashEnabled: true,
      isWalletPointsEnabled: true
    })
    await waitFor(() => {
      expect(lastControllerProps.walletList.loading).toBe(false)
    })
    expect(lastControllerProps.walletList.wallets).toHaveLength(1)
    await waitFor(() => {
      expect(lastControllerProps.userLoyaltyLevel.loading).toBe(false)
    })
    expect(pay.mockEventsOn).toHaveBeenCalledWith('gift_card_redeemed', expect.any(Function))
  })

  it('fetches transactions when wallet selection changes', async () => {
    renderController(WalletList, { notFetchTransactionsInWallets: true })
    await waitFor(() => expect(lastControllerProps.walletList.wallets).toHaveLength(1))
    lastControllerProps.setWalletSelected(3)
    await waitFor(() => {
      expect(lastControllerProps.transactionsList.loading).toBe(false)
    })
    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.test/users/8/wallets/3/events?orderBy=-id',
      expect.any(Object)
    )
  })

  it('loads loyalty levels when fetchLevels is enabled', async () => {
    renderController(WalletList, { fetchLevels: true, notFetchTransactionsInWallets: true })
    await waitFor(() => {
      expect(lastControllerProps.levelList.levels).toHaveLength(1)
    })
  })
})
