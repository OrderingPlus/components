export const sampleUser = { id: 8, name: 'Jane', lastname: 'Doe', email: 'jane@test.com', enabled: true, level: 3 }
export const sampleDriver = { id: 4, name: 'Driver', enabled: true, available: true, busy: false, level: 4 }
export const sampleConfigs = [
  { id: 1, key: 'site_name', value: 'Demo', type: 1 },
  { id: 2, key: 'driver_tip_options', value: '5|10|15', type: 3 }
]

export const usersPagination = {
  error: false,
  result: [sampleUser],
  pagination: { current_page: 1, page_size: 10, total_pages: 1, total: 1, from: 1, to: 1 }
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
      google_maps_api_key: { value: 'maps-key' },
      order_deadlines_enabled: { value: '0' }
    }
  }
}

export function createDashboardUsersApiMocks (vi) {
  return {
    mockUsersGet: vi.fn(),
    mockUserSave: vi.fn(),
    mockUserDelete: vi.fn(),
    mockOrderSave: vi.fn(),
    mockConfigSave: vi.fn(),
    mockRefreshConfigs: vi.fn(),
    mockGetOrderState: vi.fn((status) => `status-${status}`)
  }
}

export function buildDashboardUsersMockOrdering (vi, api) {
  const usersChain = {
    select: vi.fn(function () { return usersChain }),
    where: vi.fn(function () { return usersChain }),
    parameters: vi.fn(function () { return usersChain }),
    get: (options = {}) => {
      if (options.cancelToken) options.cancelToken.cancel = vi.fn()
      return api.mockUsersGet(options)
    },
    save: (...args) => api.mockUserSave(...args)
  }

  return {
    appId: 'app',
    appInternalName: 'web',
    root: 'https://api.test',
    project: 'demo',
    setAccessToken: vi.fn(() => ({
      users: vi.fn((userId) => userId !== undefined
        ? {
            select: vi.fn(() => usersChain),
            get: (...args) => api.mockUsersGet(...args),
            save: (...args) => api.mockUserSave(...args),
            delete: (...args) => api.mockUserDelete(...args)
          }
        : usersChain),
      orders: vi.fn(() => ({
        save: (...args) => api.mockOrderSave(...args)
      })),
      configs: vi.fn(() => ({
        save: (...args) => api.mockConfigSave(...args)
      }))
    })),
    users: vi.fn((userId) => userId !== undefined
      ? { save: (...args) => api.mockUserSave(...args) }
      : usersChain),
    configs: vi.fn(() => ({
      save: (...args) => api.mockConfigSave(...args)
    }))
  }
}

export function createDashboardUsersFetchMock (vi) {
  return vi.fn(async (url, options = {}) => {
    const method = options.method || 'GET'
    if (url.includes('/occupations')) {
      return { json: async () => ({ error: false, result: [{ id: 1, name: 'Chef' }] }) }
    }
    if (url.includes('/users/check_password') && method === 'POST') {
      return { json: async () => ({ error: false, result: { valid: true } }) }
    }
    if (url.includes('/codes/generate') && method === 'POST') {
      return { json: async () => ({ error: false, result: { sent: true } }) }
    }
    if (url.includes('/orders/101/messages') && method === 'GET') {
      return { json: async () => ({ error: false, result: [{ id: 1, comment: 'Hi' }] }) }
    }
    if (url.includes('/orders/101/messages') && method === 'POST') {
      return { json: async () => ({ error: false, result: { id: 2, comment: 'Reply' } }) }
    }
    if (url.includes('/orders/101/messages/1/read')) {
      return { json: async () => ({ error: false, result: true }) }
    }
    if (url.includes('/controls/orders/101')) {
      return {
        json: async () => ({
          error: false,
          result: { drivers: [sampleDriver], driver_companies: [{ id: 1, name: 'Fleet Co' }] }
        })
      }
    }
    if (url.includes('/drivergroups')) {
      return { json: async () => ({ error: false, result: [{ id: 1, administrator_id: 1 }] }) }
    }
    if (url.includes('/users/8') && method === 'DELETE') {
      return { json: async () => ({ error: false, result: { success: true } }) }
    }
    if (url.endsWith('/users') && method === 'DELETE') {
      return { json: async () => ({ error: false, result: { deleted: true } }) }
    }
    if (url.includes('/orders/101/driver_company') && method === 'PUT') {
      return { json: async () => ({ error: false, result: { success: true } }) }
    }
    return { json: async () => ({ error: false, result: {} }) }
  })
}

export function createDashboardUsersSocket (vi) {
  const socketHandlers = {}
  const mockInnerSocket = {
    connected: true,
    on: vi.fn((event, handler) => {
      socketHandlers[event] = handler
    }),
    off: vi.fn()
  }

  const mockSocket = {
    socket: mockInnerSocket,
    getId: () => 'socket-d2',
    on: vi.fn(),
    off: vi.fn(),
    join: vi.fn(),
    leave: vi.fn()
  }

  return { mockSocket, socketHandlers }
}

export function createDashboardUsersTestContext (vi) {
  const api = createDashboardUsersApiMocks(vi)
  const mockSessionState = createInitialSessionState()
  const mockConfigState = createInitialConfigState()
  const { mockSocket, socketHandlers } = createDashboardUsersSocket(vi)

  const mocks = {
    mockShowToast: vi.fn(),
    mockEmit: vi.fn(),
    mockEventsOn: vi.fn(),
    mockEventsOff: vi.fn()
  }

  const reset = () => {
    vi.clearAllMocks()
    Object.assign(mockSessionState, createInitialSessionState())
    Object.assign(mockConfigState, createInitialConfigState())
    Object.keys(socketHandlers).forEach((key) => delete socketHandlers[key])
    global.fetch = createDashboardUsersFetchMock(vi)
    window.localStorage.setItem('websocket-connected-date', new Date().toISOString())

    api.mockUsersGet.mockResolvedValue({ content: usersPagination })
    api.mockUserSave.mockResolvedValue({ content: { error: false, result: { ...sampleUser, name: 'Updated' } } })
    api.mockUserDelete.mockResolvedValue({ content: { error: false, result: { success: true } } })
    api.mockOrderSave.mockResolvedValue({ content: { error: false, result: { id: 101, driver_id: 4 } } })
    api.mockConfigSave.mockResolvedValue({ content: { error: false, result: { id: 1, key: 'site_name', value: 'New Site' } } })
    api.mockGetOrderState.mockImplementation((status) => `status-${status}`)
  }

  return {
    ...api,
    ...mocks,
    mockSessionState,
    mockConfigState,
    mockSocket,
    socketHandlers,
    mockOrdering: buildDashboardUsersMockOrdering(vi, api),
    reset,
    sampleUser,
    sampleDriver,
    sampleConfigs,
    usersPagination,
    mockT
  }
}
