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
    reset,
    defaultOrderState: h.defaultOrderState
  }
})

vi.mock('../../../contexts/ConfigContext', () => ({
  useConfig: () => [{
    configs: {
      use_parent_category: { value: '0' }
    }
  }]
}))

vi.mock('../../../contexts/OrderContext', () => ({
  useOrder: () => [menu.defaultOrderState]
}))

vi.mock('../../../contexts/CustomerContext', () => ({
  useCustomer: () => [{ user: { id: 12 } }]
}))

vi.mock('../../../contexts/ApiContext', () => ({
  useApi: () => [menu.mockOrdering]
}))

import { BusinessProductsCategories } from '../index'

describe('BusinessProductsCategories', () => {
  beforeEach(() => menu.reset())

  it('loads categories from API when not provided', async () => {
    renderController(BusinessProductsCategories, { businessSingleId: 5, categoriesProps: ['id', 'name', 'products'] })
    await waitFor(() => {
      expect(lastControllerProps.categoriesState.loading).toBe(false)
    })
    expect(menu.mockCategoriesGet).toHaveBeenCalled()
    expect(lastControllerProps.featuredProducts).toBe(true)
  })

  it('uses provided categories without fetching', async () => {
    const categories = [{ id: 2, name: 'Sides', products: [] }]
    renderController(BusinessProductsCategories, { categories, businessSingleId: 5 })
    await waitFor(() => {
      expect(lastControllerProps.categories).toEqual(categories)
    })
    expect(menu.mockCategoriesGet).not.toHaveBeenCalled()
  })
})
