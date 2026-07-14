export const sampleOrder = {
  id: 101,
  status: 0,
  business_id: 5,
  total: 25,
  subtotal: 20,
  products: [{ type: 'item', product_id: 1, name: 'Burger' }],
  summary: { total: 25, subtotal: 20, tax: 2 },
  customer: { id: 8, name: 'Test User' },
  business: { id: 5, name: 'Pizza Place' },
  paymethod: { id: 1 },
  created_at: '2026-01-01 12:00:00',
  showNotification: true
}

export const completedOrder = {
  ...sampleOrder,
  id: 102,
  status: 1
}

export const paginationPayload = {
  current_page: 1,
  page_size: 10,
  total_pages: 1,
  total: 2,
  from: 1,
  to: 2
}

export const mockT = (key, fallback) => {
  if (key === 'ESTIMATED_PREPARATION_TIME') return 'Ready in _min_ minutes'
  if (key === 'ESTIMATED_DELIVERY_TIME') return 'Delivery in _min_ minutes'
  return fallback || key
}

export function createInitialOrderState () {
  return {
    loading: false,
    options: { type: 1 },
    carts: {
      'businessId:5': { business_id: 5, uuid: 'cart-uuid-5' }
    }
  }
}

export function createInitialConfigState () {
  return {
    combine_pending_and_progress_orders: { value: '0' },
    notification_business_states: { value: '0|3|4|7' },
    notification_driver_states: { value: '0|3|8' },
    logistic_module: { value: '0' }
  }
}

export function createCustomerOrdersApiMocks (vi) {
  return {
    mockOrdersGet: vi.fn(),
    mockOrderGet: vi.fn(),
    mockOrderSave: vi.fn(),
    mockOrderDelete: vi.fn(),
    mockControlsGet: vi.fn(),
    mockBusinessGet: vi.fn(),
    mockDriverLocationsSave: vi.fn()
  }
}

export function buildCustomerOrdersMockOrdering (vi, api) {
  const ordersApiChain = {
    select: vi.fn(function () { return ordersApiChain }),
    where: vi.fn(function () { return ordersApiChain }),
    asDashboard: vi.fn(function () { return ordersApiChain }),
    get: (...args) => api.mockOrdersGet(...args)
  }

  const businessApiChain = {
    select: vi.fn(function () { return businessApiChain }),
    asDashboard: vi.fn(function () { return businessApiChain }),
    get: (...args) => api.mockBusinessGet(...args)
  }

  const controlsApiChain = {
    get: (...args) => api.mockControlsGet(...args)
  }

  const buildOrdersApi = (orderId) => {
    if (orderId !== undefined) {
      return {
        get: (...args) => api.mockOrderGet(...args),
        save: (...args) => api.mockOrderSave(...args),
        delete: (...args) => api.mockOrderDelete(...args)
      }
    }
    return ordersApiChain
  }

  return {
    appId: 'app',
    appInternalName: 'web',
    root: 'https://api.test',
    project: 'demo',
    setAccessToken: vi.fn(() => ({
      orders: vi.fn(buildOrdersApi),
      controls: vi.fn((orderId) => orderId !== undefined
        ? { get: (...args) => api.mockControlsGet(...args) }
        : controlsApiChain),
      businesses: vi.fn(() => businessApiChain),
      users: vi.fn(() => ({
        driverLocations: vi.fn(() => ({
          save: (...args) => api.mockDriverLocationsSave(...args)
        }))
      }))
    })),
    orders: vi.fn(buildOrdersApi),
    controls: vi.fn(() => controlsApiChain),
    businesses: vi.fn(() => businessApiChain)
  }
}

export function createCustomerOrdersFetchMock (vi) {
  return vi.fn(async (url, options = {}) => {
    const method = options.method || 'GET'
    if (url.includes('/orders/101/messages') && method === 'GET') {
      return { json: async () => ({ error: false, result: [{ id: 1, comment: 'Hi' }] }) }
    }
    if (url.includes('/orders/101/messages') && method === 'POST') {
      return { json: async () => ({ error: false, result: { id: 2 } }), status: 200 }
    }
    if (url.includes('/business/5/reviews') && method === 'POST') {
      return { json: async () => ({ error: false, result: { id: 9, quality: 5 } }) }
    }
    if (url.includes('/users/8/favorite_orders') && method === 'POST') {
      return { json: async () => ({ error: false, result: { success: true } }) }
    }
    if (url.includes('/users/8/favorite_orders/101') && method === 'DELETE') {
      return { json: async () => ({ error: false, result: { success: true } }) }
    }
    if (url.includes('/orders/101/messages/1/read')) {
      return { json: async () => ({ error: false, result: [{ id: 1, read: true }] }) }
    }
    if (url.includes('/orders/101/messages?mode=dashboard')) {
      return { json: async () => ({ error: false, result: [{ id: 1, comment: 'Dashboard msg' }] }) }
    }
    if (url.includes('/users/8/user_reviews') && method === 'POST') {
      return { json: async () => ({ error: false, result: { id: 3, order_id: 101 } }) }
    }
    if (url.includes('/drivers/8/assign_requests')) {
      if (method === 'PUT') {
        const body = options.body ? JSON.parse(options.body) : {}
        if (body.status === 2) {
          return { json: async () => ({ error: false, result: { status: 2 } }) }
        }
        return { json: async () => ({ error: false, result: { status: 1 } }) }
      }
      return {
        json: async () => ({
          error: false,
          result: [{
            id: 77,
            order: sampleOrder,
            updated_at: '2026-01-02 10:00:00'
          }]
        })
      }
    }
    if (url.includes('/loyalty_plans')) {
      return { json: async () => ({ error: false, result: [{ id: 1, name: 'Gold' }] }) }
    }
    if (url.includes('/businesses?')) {
      return {
        json: async () => ({
          error: false,
          result: [{ id: 5, name: 'Pizza Place', slug: 'pizza-place' }]
        })
      }
    }
    if (url.includes('/controls')) {
      return {
        json: async () => ({
          error: false,
          result: {
            drivers: [{ id: 1, name: 'Driver A' }],
            driver_groups: [{ id: 2, name: 'Group A' }],
            paymethods: [{ id: 3, name: 'Cash' }]
          }
        })
      }
    }
    return { json: async () => ({ error: false, result: {} }) }
  })
}

export function createMockSocket (vi) {
  const mockSocketInner = { on: vi.fn(), connected: true }
  return {
    socket: mockSocketInner,
    getId: () => 'socket-16',
    on: vi.fn(),
    off: vi.fn(),
    join: vi.fn(),
    leave: vi.fn()
  }
}

export function createCustomerOrdersTestContext (vi) {
  const api = createCustomerOrdersApiMocks(vi)
  const mockOrderState = createInitialOrderState()
  const mockConfigState = createInitialConfigState()
  const mockSocket = createMockSocket(vi)

  const mocks = {
    mockShowToast: vi.fn(),
    mockEmit: vi.fn(),
    mockEventsOn: vi.fn(),
    mockEventsOff: vi.fn(),
    mockReorder: vi.fn().mockResolvedValue({
      error: false,
      result: [{ uuid: 'cart-uuid-5', business_id: 5 }]
    }),
    mockClearCart: vi.fn().mockResolvedValue({ error: false, result: {} }),
    mockOnRedirectPage: vi.fn(),
    mockOnNavigationRedirect: vi.fn(),
    mockHandleRedirectToCheckout: vi.fn(),
    mockHandleUpdateOrderList: vi.fn(),
    mockHandleUpdateSingleOrder: vi.fn(),
    mockHandleReorder: vi.fn(),
    mockOnSaveReview: vi.fn(),
    mockOnOrdersDeleted: vi.fn()
  }

  const reset = () => {
    vi.clearAllMocks()
    Object.assign(mockOrderState, createInitialOrderState())
    Object.assign(mockConfigState, createInitialConfigState())
    global.fetch = createCustomerOrdersFetchMock(vi)

    api.mockOrdersGet.mockImplementation(async (options) => {
      if (options?.cancelToken) {
        options.cancelToken.cancel = vi.fn()
      }
      return {
        content: {
          error: false,
          result: [sampleOrder, completedOrder],
          pagination: paginationPayload
        }
      }
    })
    api.mockOrderGet.mockImplementation(async (options) => {
      if (options?.cancelToken) {
        options.cancelToken.cancel = vi.fn()
      }
      return {
        content: { error: false, result: sampleOrder }
      }
    })
    api.mockOrderSave.mockResolvedValue({
      content: { error: false, result: { ...sampleOrder, status: 7, prepared_in: 15 } }
    })
    api.mockOrderDelete.mockResolvedValue({
      content: { error: false }
    })
    api.mockControlsGet.mockResolvedValue({
      content: {
        error: false,
        result: {
          drivers: [{ id: 4, name: 'Driver B' }],
          driver_groups: [{ id: 5, drivers: [4] }],
          paymethods: [{ id: 6, name: 'Stripe' }]
        }
      }
    })
    api.mockBusinessGet.mockResolvedValue({
      content: { error: false, result: { id: 5, slug: 'pizza-place' } }
    })
    api.mockDriverLocationsSave.mockResolvedValue({
      content: { error: false, result: { lat: 10, lng: 20 } }
    })
    mocks.mockReorder.mockResolvedValue({
      error: false,
      result: [{ uuid: 'cart-uuid-5', business_id: 5 }]
    })
    mocks.mockClearCart.mockResolvedValue({ error: false, result: {} })
    mockConfigState.combine_pending_and_progress_orders.value = '0'
    mockConfigState.logistic_module.value = '0'
  }

  return {
    ...api,
    ...mocks,
    mockOrderState,
    mockConfigState,
    mockSocket,
    mockOrdering: buildCustomerOrdersMockOrdering(vi, api),
    reset,
    sampleOrder,
    completedOrder,
    paginationPayload,
    mockT
  }
}
