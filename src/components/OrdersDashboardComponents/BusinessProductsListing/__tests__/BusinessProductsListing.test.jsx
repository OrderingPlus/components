import { describe, it, expect, vi, beforeEach } from 'vitest'
import { waitFor, act } from '@testing-library/react'
import { renderController, lastControllerProps } from '../../../../__tests__/helpers/renderController'

const d3 = vi.hoisted(() => {
  const { createDashboardBusinessTestContext } = require('../../../../__tests__/helpers/dashboardBusinessTestHelpers')
  return createDashboardBusinessTestContext(vi)
})

vi.mock('../../../../contexts/EventContext', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    useEvent: () => [{ emit: d3.mockEmit, on: d3.mockEventsOn, off: d3.mockEventsOff }]
  }
})

import { BusinessProductsListing } from '../index'

describe('BusinessProductsListing', () => {
  const listingProps = {
    slug: 'demo-store',
    ordering: null,
    isSearchByName: true,
    isSearchByDescription: true,
    isInitialRender: false
  }

  beforeEach(() => {
    d3.reset()
    listingProps.ordering = d3.listingOrdering
  })

  it('loads business and supporting data on mount', async () => {
    renderController(BusinessProductsListing, listingProps)
    await waitFor(() => {
      expect(lastControllerProps.businessState.loading).toBe(false)
    })
    expect(lastControllerProps.businessState.business.name).toBe('Demo Store')
    expect(lastControllerProps.businessTypes).toHaveLength(1)
  })

  it('selects a category and filters products by search', async () => {
    renderController(BusinessProductsListing, listingProps)
    await waitFor(() => expect(lastControllerProps.businessState.business.id).toBe(5))
    act(() => {
      lastControllerProps.handleChangeCategory(null, d3.sampleCategory)
    })
    act(() => {
      lastControllerProps.handleChangeSearch('burger')
    })
    await waitFor(() => {
      expect(lastControllerProps.categoryState.products).toHaveLength(1)
    })
    act(() => {
      lastControllerProps.handleChangeSearch('pizza')
    })
    await waitFor(() => {
      expect(lastControllerProps.categoryState.products).toHaveLength(0)
    })
  })

  it('opens parent category with subcategories', async () => {
    const parentCategory = {
      id: 2,
      name: 'Menu',
      products: [],
      subcategories: [{ id: 3, name: 'Lunch', products: [] }]
    }
    d3.mockBusinessListingGet.mockResolvedValueOnce({
      content: {
        error: false,
        result: { ...d3.sampleBusinessDetail, categories: [parentCategory] }
      }
    })
    renderController(BusinessProductsListing, listingProps)
    await waitFor(() => expect(lastControllerProps.businessState.business.id).toBe(5))
    act(() => {
      lastControllerProps.handleChangeCategory(null, parentCategory)
    })
    expect(lastControllerProps.openCategories).toContain(2)
    act(() => {
      lastControllerProps.setOpenCategories({ values: [] })
    })
    expect(lastControllerProps.openCategories).toHaveLength(0)
  })

  it('updates business state after external change', async () => {
    renderController(BusinessProductsListing, listingProps)
    await waitFor(() => expect(lastControllerProps.businessState.business.id).toBe(5))
    act(() => {
      lastControllerProps.handleUpdateBusinessState({ name: 'Updated Store' })
    })
    await waitFor(() => {
      expect(lastControllerProps.businessState.business.name).toBe('Updated Store')
    })
  })
})
