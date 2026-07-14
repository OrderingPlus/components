export const sampleCity = { id: 1, name: 'Miami', enabled: true }
export const sampleCountry = { id: 1, name: 'United States', code: 'US', enabled: true }
export const sampleBusiness = { id: 5, name: 'Demo Store' }
export const sampleCategory = {
  id: 1,
  name: 'Food',
  products: [{ id: 10, name: 'Burger', description: 'Tasty burger' }],
  subcategories: []
}
export const sampleBusinessDetail = {
  id: 5,
  name: 'Demo Store',
  categories: [sampleCategory],
  lazy_load_products_recommended: false
}

export const fullFilterValues = {
  statuses: [0, 1],
  deliveryFromDatetime: '2026-01-01',
  deliveryEndDatetime: '2026-01-31',
  businessIds: [5],
  driverIds: [4],
  deliveryTypes: [1],
  paymethodIds: [2]
}

export function createInitialSessionState () {
  return {
    auth: true,
    loading: false,
    user: { id: 1, level: 0, settings: {} },
    token: 'admin-tok'
  }
}

export function createDashboardBusinessApiMocks (vi) {
  return {
    mockCountriesGet: vi.fn(),
    mockBusinessesDashboardGet: vi.fn(),
    mockBusinessListingGet: vi.fn()
  }
}

export function buildDashboardBusinessMockOrdering (vi, api) {
  const countriesChain = {
    where: vi.fn(function () { return countriesChain }),
    select: vi.fn(function () { return countriesChain }),
    get: () => api.mockCountriesGet()
  }

  return {
    appId: 'app',
    appInternalName: 'web',
    root: 'https://api.test',
    project: 'demo',
    countries: vi.fn(() => countriesChain),
    businesses: vi.fn(() => ({
      asDashboard: vi.fn(() => ({
        get: (...args) => api.mockBusinessesDashboardGet(...args)
      }))
    }))
  }
}

export function buildListingOrdering (vi, api) {
  return {
    root: 'https://api.test',
    businesses: vi.fn(() => ({
      asDashboard: vi.fn(() => ({
        get: (...args) => api.mockBusinessListingGet(...args)
      })),
      categories: vi.fn(() => ({
        products: vi.fn(() => ({
          get: vi.fn(async () => ({ content: { result: { id: 10, name: 'Burger' } } }))
        }))
      }))
    }))
  }
}

export function createDashboardBusinessFetchMock (vi) {
  return vi.fn(async (url, options = {}) => {
    const method = options.method || 'GET'
    if (url.includes('/orders.csv')) {
      return { json: async () => ({ error: false, result: { url: 'https://cdn.test/orders.csv' } }) }
    }
    if (url.includes('/gift_cards')) {
      return {
        json: async () => ({
          error: false,
          result: [{ id: 1, status: 'pending', amount: 50 }],
          pagination: { current_page: 1, page_size: 10, total_pages: 1, total: 1, from: 1, to: 1 }
        })
      }
    }
    if (url.includes('/orders/101/metafields') && method === 'GET') {
      return { json: async () => ({ error: false, result: [{ id: 1, key: 'zone', value: 'north' }] }) }
    }
    if (url.includes('/orders/101/metafields') && method === 'POST') {
      return { json: async () => ({ error: false, result: { id: 2, key: 'note', value: 'vip' } }) }
    }
    if (url.includes('/orders/101/metafields/1') && method === 'DELETE') {
      return { ok: true, json: async () => ({ error: false, result: true }) }
    }
    if (url.includes('/loyalty_levels')) {
      return { json: async () => ({ error: false, result: [{ id: 1, name: 'Bronze', points: 100 }] }) }
    }
    if (url.includes('/taxes')) {
      return { json: async () => ({ error: false, result: [{ id: 1, name: 'Sales Tax', rate: 7 }] }) }
    }
    if (url.includes('/fees')) {
      return { json: async () => ({ error: false, result: [{ id: 1, name: 'Service Fee', fixed: 2 }] }) }
    }
    if (url.includes('/sites')) {
      return { json: async () => ({ error: false, result: [{ id: 1, name: 'Main Site' }] }) }
    }
    if (url.includes('/business_types')) {
      return { json: async () => ({ error: false, result: [{ id: 1, name: 'Restaurant', enabled: true }] }) }
    }
    return { json: async () => ({ error: false, result: [] }) }
  })
}

export function createDashboardBusinessTestContext (vi) {
  const api = createDashboardBusinessApiMocks(vi)
  const mockSessionState = createInitialSessionState()

  const mocks = {
    mockEmit: vi.fn(),
    mockEventsOn: vi.fn(),
    mockEventsOff: vi.fn()
  }

  const reset = () => {
    vi.clearAllMocks()
    Object.assign(mockSessionState, createInitialSessionState())
    global.fetch = createDashboardBusinessFetchMock(vi)

    api.mockCountriesGet.mockResolvedValue({
      content: { error: false, result: [{ ...sampleCountry, cities: [sampleCity] }] }
    })
    api.mockBusinessesDashboardGet.mockResolvedValue({
      content: { error: false, result: [sampleBusiness] }
    })
    api.mockBusinessListingGet.mockResolvedValue({
      content: { error: false, result: sampleBusinessDetail }
    })
  }

  return {
    ...api,
    ...mocks,
    mockSessionState,
    mockOrdering: buildDashboardBusinessMockOrdering(vi, api),
    listingOrdering: buildListingOrdering(vi, api),
    reset,
    sampleCity,
    sampleCountry,
    sampleBusiness,
    sampleCategory,
    sampleBusinessDetail,
    fullFilterValues
  }
}
