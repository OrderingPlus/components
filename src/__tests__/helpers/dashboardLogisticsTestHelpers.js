export const sampleOrder = { id: 101, customer_id: 8 }
export const sampleBusiness = { id: 5, name: 'Demo Store' }

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
      google_maps_api_key: { id: 12, value: 'old-key' }
    }
  }
}

export function defaultScheduleList () {
  return Array.from({ length: 7 }, () => ({
    enabled: true,
    lapses: [{ open: { hour: 9, minute: 0 }, close: { hour: 17, minute: 0 } }]
  }))
}

export function buildMockOrdering () {
  return {
    appId: 'app',
    appInternalName: 'web',
    root: 'https://api.test',
    project: 'demo'
  }
}

export function createDashboardLogisticsFetchMock (vi) {
  return vi.fn(async (url, options = {}) => {
    const method = options.method || 'GET'
    if (url.includes('/business/5/calendar_events')) {
      return { json: async () => ({ error: false, result: [{ id: 1, title: 'Lunch rush' }] }) }
    }
    if (url.includes('/configs/12') && method === 'PUT') {
      return { json: async () => ({ error: false, result: { id: 12, key: 'google_maps_api_key', value: 'new-key' } }) }
    }
    if (url.includes('/logistic/orders/101/information')) {
      return { ok: true, json: async () => ({ error: false, result: [{ id: 1, status: 0 }] }) }
    }
    if (url.includes('/orders/101/logs')) {
      return { json: async () => ({ error: false, result: [{ id: 1, event: 'logistic_started', data: {} }] }) }
    }
    if (url.includes('/users/8/user_reviews') && method === 'POST') {
      return { json: async () => ({ error: false, result: { id: 1, qualification: 5 } }) }
    }
    return { ok: true, json: async () => ({ error: false, result: [] }) }
  })
}

export function createDashboardLogisticsTestContext (vi) {
  const mockSessionState = createInitialSessionState()
  const mockConfigState = createInitialConfigState()

  const mocks = {
    mockShowToast: vi.fn(),
    mockEmit: vi.fn(),
    mockEventsOn: vi.fn(),
    mockEventsOff: vi.fn(),
    mockRefreshConfigs: vi.fn(),
    mockGetOrderState: vi.fn((status) => `status-${status}`),
    mockParseDistance: vi.fn((distance) => `${distance}mi`)
  }

  const reset = () => {
    vi.clearAllMocks()
    Object.assign(mockSessionState, createInitialSessionState())
    Object.assign(mockConfigState, createInitialConfigState())
    global.fetch = createDashboardLogisticsFetchMock(vi)
    mocks.mockRefreshConfigs.mockResolvedValue(undefined)
    mocks.mockGetOrderState.mockImplementation((status) => `status-${status}`)
    mocks.mockParseDistance.mockImplementation((distance) => `${distance}mi`)
  }

  return {
    ...mocks,
    mockSessionState,
    mockConfigState,
    mockOrdering: buildMockOrdering(),
    reset,
    sampleOrder,
    sampleBusiness,
    mockT
  }
}
