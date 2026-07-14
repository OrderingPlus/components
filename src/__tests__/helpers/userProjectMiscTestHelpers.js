export const sampleUser = {
  id: 8,
  name: 'Test',
  lastname: 'User',
  email: 'test@example.com',
  cellphone: '5551234567',
  country_phone_code: '1'
}

export const giftProduct = { id: 99, name: 'Gift $50', type: 'gift_card', price: 50 }

export const businessWithSchedule = {
  id: 5,
  timezone: 'America/New_York',
  schedule: Array.from({ length: 7 }, () => ({
    enabled: true,
    lapses: [{ open: { hour: 9, minute: 0 }, close: { hour: 17, minute: 0 } }]
  }))
}

export const mockT = (key, fallback) => fallback || key

export function createInitialOrderState () {
  return {
    loading: false,
    options: {
      type: 1,
      moment: null,
      address: { location: { lat: 40.7, lng: -74 } }
    },
    carts: {
      'businessId:5': { business_id: 5, uuid: 'cart-business-5', products: [] },
      'no-business': { uuid: 'gift-cart-uuid', products: [{ id: 99, type: 'gift_card' }] }
    }
  }
}

export function createUserProjectMiscApiMocks (vi) {
  return {
    mockUserGet: vi.fn(),
    mockUserSave: vi.fn()
  }
}

export function buildUserProjectMiscMockOrdering (vi, api) {
  const ordering = {
    appId: 'app',
    appInternalName: 'web',
    root: 'https://api.test',
    project: 'demo',
    setAccessToken: vi.fn(() => ordering),
    users: vi.fn(() => ({
      get: (...args) => api.mockUserGet(...args),
      save: (...args) => api.mockUserSave(...args)
    }))
  }
  return ordering
}

export function createUserProjectMiscFetchMock (vi) {
  return vi.fn(async (url, options = {}) => {
    const method = options.method || 'GET'
    if (url.includes('/platform_products')) {
      return { json: async () => ({ error: false, result: [giftProduct] }) }
    }
    if (url.includes('/gift_cards/redeem') && method === 'POST') {
      return { json: async () => ({ error: false, result: { id: 1, balance: 50 } }) }
    }
    if (url.includes('/gift_cards/') && url.includes('/send') && method === 'POST') {
      return { json: async () => ({ error: false, result: { success: true } }) }
    }
    if (url.includes('/gift_cards?')) {
      return {
        json: async () => ({
          error: false,
          result: [{ id: 1, status: 1, balance: 50 }],
          pagination: { current_page: 1, page_size: 10, total_pages: 1, total: 1, from: 1, to: 1 }
        })
      }
    }
    if (url.includes('/auth/sms/twilio/verify') && method === 'POST') {
      return { json: async () => ({ error: false, result: { sent: true } }) }
    }
    if (url.includes('/users/8') && method === 'DELETE') {
      return { json: async () => ({ error: false, result: { success: true } }) }
    }
    if (url.includes('/users/8/wallets')) {
      return {
        json: async () => ({
          error: false,
          result: [
            { type: 'cash', balance: 10 },
            { type: 'credit_point', balance: 100 }
          ]
        })
      }
    }
    return { json: async () => ({ error: false, result: {} }) }
  })
}

export function createMockSocket (vi) {
  return {
    socket: { on: vi.fn(), connected: true },
    getId: () => 'socket-19',
    on: vi.fn(),
    off: vi.fn(),
    join: vi.fn(),
    leave: vi.fn()
  }
}

export function createUserProjectMiscTestContext (vi) {
  const api = createUserProjectMiscApiMocks(vi)
  const mockOrderState = createInitialOrderState()
  const mockSocket = createMockSocket(vi)

  const mocks = {
    mockShowToast: vi.fn(),
    mockEmit: vi.fn(),
    mockChangeUser: vi.fn(),
    mockSetUserCustomer: vi.fn(),
    mockSetOrdering: vi.fn(),
    mockSetStoreData: vi.fn(),
    mockEventEmitter: { emit: vi.fn() },
    mockChangeMoment: vi.fn(),
    mockAddProduct: vi.fn(),
    mockRemoveProduct: vi.fn(),
    mockOnClose: vi.fn(),
    mockHandleSuccessUpdate: vi.fn(),
    mockHandleCustomGoToCheckout: vi.fn(),
    mockSetIsGiftCardSent: vi.fn(),
    mockSetRefreshOrders: vi.fn()
  }

  const reset = () => {
    vi.clearAllMocks()
    Object.assign(mockOrderState, createInitialOrderState())
    global.fetch = createUserProjectMiscFetchMock(vi)

    api.mockUserSave.mockResolvedValue({
      content: { error: false, result: { ...sampleUser, name: 'Updated' } }
    })
    mocks.mockAddProduct.mockResolvedValue({
      error: false,
      result: { uuid: 'new-gift-cart', products: [giftProduct] }
    })
  }

  return {
    ...api,
    ...mocks,
    mockOrderState,
    mockSocket,
    mockOrdering: buildUserProjectMiscMockOrdering(vi, api),
    reset,
    sampleUser,
    giftProduct,
    businessWithSchedule,
    mockT
  }
}
