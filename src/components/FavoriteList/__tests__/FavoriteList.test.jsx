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

import { FavoriteList } from '../index'

describe('FavoriteList', () => {
  beforeEach(() => acms.reset())

  it('loads favorite orders and resolves original list', async () => {
    renderController(FavoriteList, {
      favoriteURL: 'favorite_orders',
      originalURL: 'orders'
    })
    await waitFor(() => {
      expect(lastControllerProps.favoriteList.loading).toBe(false)
    })
    expect(lastControllerProps.favoriteList.favorites).toHaveLength(1)
  })

  it('removes unfavorited items from the list', async () => {
    renderController(FavoriteList, {
      favoriteURL: 'favorite_orders',
      originalURL: 'orders',
      handleUpdateFavoriteList: acms.mockHandleUpdateFavoriteList
    })
    await waitFor(() => expect(lastControllerProps.favoriteList.favorites).toHaveLength(1))
    act(() => {
      lastControllerProps.handleUpdateFavoriteList(101, { favorite: false })
    })
    expect(lastControllerProps.favoriteList.favorites).toHaveLength(0)
  })
})
