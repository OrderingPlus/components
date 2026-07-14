import { describe, it, expect, vi, beforeEach } from 'vitest'
import { waitFor } from '@testing-library/react'
import { renderController, lastControllerProps } from '../../../__tests__/helpers/renderController'

const biz = vi.hoisted(() => {
  const h = require('../../../__tests__/helpers/businessDiscoveryTestHelpers')
  const api = h.createBusinessApiMocks(vi)
  const reset = () => {
    vi.clearAllMocks()
    h.applyDefaultBusinessMockImplementations(vi, api)
    h.setupFetchMock(vi)
  }
  return {
    ...api,
    mockOrdering: h.buildBusinessMockOrdering(vi, api),
    mockSocket: h.createBusinessMockSocket(vi),
    reset,
    defaultOrderState: h.defaultOrderState
  }
})

vi.mock('../../../contexts/LanguageContext', () => ({
  useLanguage: () => [{ language: { code: 'en' } }, (key, fallback) => fallback || key]
}))

vi.mock('../../../contexts/SessionContext', () => ({
  useSession: () => [{
    auth: true,
    user: { id: 8 },
    token: 'session-tok'
  }, { refreshUserInfo: vi.fn() }]
}))

vi.mock('../../../contexts/OrderingThemeContext', () => ({
  useOrderingTheme: () => [{ theme: { business_listing_view: { components: { cities: { hidden: true } } } } }]
}))

vi.mock('../../../contexts/OrderContext', () => ({
  useOrder: () => [biz.defaultOrderState, { changeAddress: vi.fn() }]
}))

vi.mock('../../../contexts/ApiContext', () => ({
  useApi: () => [biz.mockOrdering]
}))

vi.mock('../../../contexts/WebsocketContext', () => ({
  useWebsocket: () => biz.mockSocket
}))

import { BusinessSearchList } from '../index'

describe('BusinessSearchList', () => {
  beforeEach(() => biz.reset())

  it('loads brand list on mount', async () => {
    renderController(BusinessSearchList, { lazySearch: true })
    await waitFor(() => {
      expect(lastControllerProps.brandList.loading).toBe(false)
    })
    expect(lastControllerProps.brandList.brands).toHaveLength(1)
  })

  it('searches when term has at least three characters', async () => {
    renderController(BusinessSearchList, { lazySearch: true })
    lastControllerProps.handleChangeTermValue('burger')
    await waitFor(() => {
      expect(lastControllerProps.businessesSearchList.loading).toBe(false)
    })
    expect(lastControllerProps.termValue).toBe('burger')
    expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/search'), expect.any(Object))
  })

  it('toggles orderBy filter direction', async () => {
    renderController(BusinessSearchList, { lazySearch: true })
    lastControllerProps.handleChangeFilters('orderBy', 'distance')
    await waitFor(() => {
      expect(lastControllerProps.filters.orderBy).toBe('distance')
    })
    lastControllerProps.handleChangeFilters('orderBy', 'distance')
    await waitFor(() => {
      expect(lastControllerProps.filters.orderBy).toBe('-distance')
    })
  })

  it('updates business in search results', async () => {
    renderController(BusinessSearchList, { lazySearch: true })
    lastControllerProps.handleChangeTermValue('burger')
    await waitFor(() => expect(lastControllerProps.businessesSearchList.businesses).toHaveLength(1))
    lastControllerProps.handleUpdateBusinessList(2, { open: false })
    await waitFor(() => {
      expect(lastControllerProps.businessesSearchList.businesses[0].open).toBe(false)
    })
  })

  it('updates nested product data', async () => {
    renderController(BusinessSearchList, { lazySearch: true })
    lastControllerProps.handleChangeTermValue('burger')
    await waitFor(() => expect(lastControllerProps.businessesSearchList.businesses).toHaveLength(1))
    lastControllerProps.handleUpdateProducts(44, 9, 2, { name: 'Double Burger' })
    await waitFor(() => {
      const product = lastControllerProps.businessesSearchList.businesses[0].categories[0].products[0]
      expect(product.name).toBe('Double Burger')
    })
  })
})
