import { describe, it, expect, vi, beforeEach } from 'vitest'
import { waitFor } from '@testing-library/react'
import { renderController, lastControllerProps } from '../../../__tests__/helpers/renderController'

const menu = vi.hoisted(() => {
  const h = require('../../../__tests__/helpers/menuListingTestHelpers')
  const api = h.createMenuListingApiMocks(vi)
  const reset = () => {
    vi.clearAllMocks()
    h.applyDefaultMenuListingMockImplementations(vi, api)
  }
  return {
    ...api,
    mockOrdering: h.buildMenuListingMockOrdering(vi, api),
    reset
  }
})

vi.mock('../../../contexts/ApiContext', () => ({
  useApi: () => [menu.mockOrdering]
}))

import { BusinessMenuListing } from '../index'

describe('BusinessMenuListing', () => {
  beforeEach(() => menu.reset())

  it('loads menus for a business', async () => {
    renderController(BusinessMenuListing, { businessId: 5 })
    await waitFor(() => {
      expect(lastControllerProps.businessMenuList.loading).toBe(false)
    })
    expect(menu.mockMenusGet).toHaveBeenCalled()
    expect(lastControllerProps.businessMenuList.menus).toHaveLength(1)
  })
})
