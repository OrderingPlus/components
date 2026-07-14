export const sampleBusiness = { id: 1, name: 'Store A', enabled: true, featured: false }

export const sampleOrder = {
  id: 101,
  status: 0,
  business_id: 1,
  customer_id: 8,
  delivery_type: 1,
  driver_id: null,
  unread_count: 2,
  unread_general_count: 1,
  unread_direct_count: 1,
  last_message_at: null,
  products: [{ type: 'item' }]
}

export const paginationContent = {
  error: false,
  result: [sampleOrder],
  pagination: { current_page: 1, page_size: 10, total_pages: 1, total: 1, from: 1, to: 1 }
}

export const allowColumns = {
  dateTime: { order: 0, visable: true, draggable: true },
  status: { order: 1, visable: true, draggable: true }
}

export const mockT = (key, fallback) => fallback || key

export function createInitialSessionState () {
  return {
    auth: true,
    loading: false,
    user: { id: 1, level: 0, settings: {} },
    token: 'admin-tok'
  }
}

export function createInitialConfigState () {
  return {
    loading: false,
    configs: {
      order_deadlines_enabled: { value: '0' }
    }
  }
}

export function createDashboardOrdersApiMocks (vi) {
  return {
    mockBusinessesGet: vi.fn(),
    mockCountriesGet: vi.fn(),
    mockOrdersListGet: vi.fn(),
    mockOrderGet: vi.fn(),
    mockOrderSave: vi.fn(),
    mockUsersGet: vi.fn(),
    mockUserSettingsGet: vi.fn(),
    mockProductsGet: vi.fn()
  }
}

export function buildDashboardOrdersMockOrdering (vi, api) {
  const businessesChain = {
    select: vi.fn(function () { return businessesChain }),
    asDashboard: vi.fn(function () { return businessesChain }),
    where: vi.fn(function () { return businessesChain }),
    parameters: vi.fn(function () { return businessesChain }),
    get: (...args) => api.mockBusinessesGet(...args)
  }

  const ordersListChain = {
    asDashboard: vi.fn(function () { return ordersListChain }),
    select: vi.fn(function () { return ordersListChain }),
    where: vi.fn(function () { return ordersListChain }),
    get: (...args) => api.mockOrdersListGet(...args)
  }

  const usersChain = {
    select: vi.fn(function () { return usersChain }),
    where: vi.fn(function () { return usersChain }),
    get: (options = {}) => {
      if (options.cancelToken) {
        options.cancelToken.cancel = vi.fn()
      }
      return api.mockUsersGet(options)
    }
  }

  return {
    appId: 'app',
    appInternalName: 'web',
    root: 'https://api.test',
    project: 'demo',
    setAccessToken: vi.fn(() => ({
      businesses: vi.fn(() => businessesChain),
      orders: vi.fn((orderId) => orderId !== undefined
        ? {
            asDashboard: vi.fn(function () {
              return {
                select: vi.fn(function () {
                  return { get: (...args) => api.mockOrderGet(...args) }
                }),
                get: (...args) => api.mockOrderGet(...args)
              }
            }),
            select: vi.fn(function () {
              return { get: (...args) => api.mockOrderGet(...args) }
            }),
            get: (...args) => api.mockOrderGet(...args),
            save: (...args) => api.mockOrderSave(...args)
          }
        : ordersListChain),
      users: vi.fn(() => usersChain)
    })),
    countries: vi.fn(() => ({ get: (...args) => api.mockCountriesGet(...args) })),
    businesses: vi.fn((businessId) => businessId !== undefined
      ? {
          products: vi.fn(() => ({
            where: vi.fn(() => ({
              get: (...args) => api.mockProductsGet(...args)
            }))
          }))
        }
      : businessesChain),
    users: vi.fn((userId) => ({
      select: vi.fn(() => ({
        get: (...args) => (userId !== undefined ? api.mockUserSettingsGet(...args) : api.mockUsersGet(...args))
      })),
      save: vi.fn().mockResolvedValue({ content: { error: false, result: {} } })
    }))
  }
}

export function createDashboardOrdersFetchMock (vi) {
  return vi.fn(async (url, options = {}) => {
    const method = options.method || 'GET'
    if (url.includes('/controls/orders')) {
      return {
        json: async () => ({
          error: false,
          result: {
            cities: [{ id: 1, name: 'NYC' }],
            driver_groups: [{ id: 1, name: 'Group A', drivers: [4] }],
            paymethods: [{ id: 1, name: 'Cash' }],
            businesses: [sampleBusiness]
          }
        })
      }
    }
    if (url.includes('/orders/dashboard')) {
      return {
        json: async () => ({
          error: false,
          result: [
            { status: 0, quantity: 3 },
            { status: 7, quantity: 2 },
            { status: 1, quantity: 5 }
          ]
        })
      }
    }
    if (url.includes('/business') && method === 'PUT') {
      return { json: async () => ({ error: false, result: { success: true } }) }
    }
    if (url.includes('/business') && method === 'DELETE') {
      return { json: async () => ({ error: false, result: { success: true } }) }
    }
    if (url.includes('/orders/101/messages') && method === 'GET') {
      return { json: async () => ({ error: false, result: [{ id: 1, comment: 'Hi' }] }) }
    }
    if (url.includes('/orders/101/messages') && method === 'POST') {
      return { ok: true, status: 200, json: async () => ({ error: false }) }
    }
    if (url.includes('/orders/101') && method === 'PUT') {
      return { json: async () => ({ error: false, result: { id: 101, status: 1 } }) }
    }
    if (url.includes('/orders') && method === 'DELETE') {
      return { json: async () => ({ error: false, result: { success: true } }) }
    }
    if (url.includes('/orders/') && method === 'PUT') {
      return { json: async () => ({ error: false, result: { id: 101, status: 1 } }) }
    }
    return { json: async () => ({ error: false, result: {} }) }
  })
}

export function createMockSocket (vi) {
  return {
    socket: { on: vi.fn(), connected: true },
    getId: () => 'socket-d1',
    on: vi.fn(),
    off: vi.fn(),
    join: vi.fn(),
    leave: vi.fn()
  }
}

export function createDashboardOrdersTestContext (vi) {
  const api = createDashboardOrdersApiMocks(vi)
  const mockSessionState = createInitialSessionState()
  const mockConfigState = createInitialConfigState()
  const mockSocket = createMockSocket(vi)

  const mocks = {
    mockShowToast: vi.fn(),
    mockEmit: vi.fn(),
    mockEventsOn: vi.fn(),
    mockEventsOff: vi.fn(),
    mockUpdateProduct: vi.fn()
  }

  const reset = () => {
    vi.clearAllMocks()
    Object.assign(mockSessionState, createInitialSessionState())
    Object.assign(mockConfigState, createInitialConfigState())
    global.fetch = createDashboardOrdersFetchMock(vi)

    api.mockCountriesGet.mockResolvedValue({
      content: {
        error: false,
        result: [{
          id: 1,
          code: 'US',
          name: 'United States',
          enabled: true,
          cities: [{ id: 1, name: 'NYC' }]
        }]
      }
    })
    api.mockBusinessesGet.mockResolvedValue({
      content: {
        error: false,
        result: [sampleBusiness],
        pagination: { current_page: 1, page_size: 10, total_pages: 1, total: 1, from: 1, to: 1 }
      }
    })
    api.mockOrdersListGet.mockImplementation(async (options = {}) => {
      if (options.cancelToken) {
        options.cancelToken.cancel = vi.fn()
      }
      return { content: paginationContent }
    })
    api.mockOrderGet.mockResolvedValue({ content: { error: false, result: sampleOrder } })
    api.mockOrderSave.mockResolvedValue({ content: { error: false, result: { ...sampleOrder, status: 1 } } })
    api.mockUsersGet.mockResolvedValue({ content: { error: false, result: [{ id: 4, name: 'Driver', level: 4 }] } })
    api.mockUserSettingsGet.mockResolvedValue({ content: { error: false, result: { settings: {} } } })
    api.mockProductsGet.mockResolvedValue({ content: { error: false, result: [{ id: 5, name: 'Burger', quantity: 1 }] } })
    mocks.mockUpdateProduct.mockResolvedValue(true)
  }

  return {
    ...api,
    ...mocks,
    mockSessionState,
    mockConfigState,
    mockSocket,
    mockOrdering: buildDashboardOrdersMockOrdering(vi, api),
    reset,
    sampleBusiness,
    sampleOrder,
    paginationContent,
    allowColumns,
    mockT
  }
}
