export const defaultAddressConfigs = {
  google_maps_api_key: { value: 'gmaps-key' },
  use_alternative_to_google_maps: { value: '0' },
  map_box_token: { value: 'mapbox-token' },
  default_country_code: { value: 'US' },
  location_default_latitude: { value: '40.7' },
  location_default_longitude: { value: '-74.0' }
}

export const withCancelToken = (vi, resolver) => vi.fn((options = {}) => {
  if (options.cancelToken) {
    options.cancelToken.cancel = vi.fn()
  }
  return resolver(options)
})

export function createAddressApiMocks (vi) {
  return {
    mockAddressGet: withCancelToken(vi, () => Promise.resolve({
      content: { error: false, result: { id: 5, address: 'Old St', zipcode: '10001' } }
    })),
    mockAddressSave: vi.fn(),
    mockAddressDelete: vi.fn(),
    mockAddressesListGet: withCancelToken(vi, () => Promise.resolve({
      content: { error: false, result: [{ id: 1, address: 'Home', default: true }] }
    })),
    mockGuestSave: vi.fn(),
    mockBusinessGet: withCancelToken(vi, () => Promise.resolve({
      content: { result: { location: { lat: 40.1, lng: -73.9 }, logo: 'logo.png' } }
    })),
    mockBusinessZonesGet: withCancelToken(vi, () => Promise.resolve({
      content: {
        error: false,
        result: [{
          location: { lat: 1, lng: 2 },
          logo: 'z.png',
          slug: 'store',
          zones: []
        }]
      }
    })),
    mockUsersSearchGet: withCancelToken(vi, () => Promise.resolve({
      content: { result: [{ id: 20, cellphone: '5551234567', name: 'Pat' }] }
    }))
  }
}

export function applyDefaultAddressMockImplementations (vi, api) {
  api.mockAddressGet.mockImplementation((options = {}) => {
    if (options.cancelToken) options.cancelToken.cancel = vi.fn()
    return Promise.resolve({
      content: { error: false, result: { id: 5, address: 'Old St', zipcode: '10001' } }
    })
  })
  api.mockAddressSave.mockResolvedValue({
    content: { error: false, result: { id: 6, address: 'New St', country_code: 'US', default: true } }
  })
  api.mockAddressDelete.mockResolvedValue({
    content: { error: false, result: {} }
  })
  api.mockAddressesListGet.mockImplementation((options = {}) => {
    if (options.cancelToken) options.cancelToken.cancel = vi.fn()
    return Promise.resolve({
      content: { error: false, result: [{ id: 1, address: 'Home', default: true }] }
    })
  })
  api.mockGuestSave.mockResolvedValue({
    content: { error: false, result: { id: 99, session: { access_token: 'guest-tok' } } }
  })
  api.mockBusinessGet.mockImplementation((options = {}) => {
    if (options.cancelToken) options.cancelToken.cancel = vi.fn()
    return Promise.resolve({
      content: { result: { location: { lat: 40.1, lng: -73.9 }, logo: 'logo.png' } }
    })
  })
  api.mockBusinessZonesGet.mockImplementation((options = {}) => {
    if (options.cancelToken) options.cancelToken.cancel = vi.fn()
    return Promise.resolve({
      content: {
        error: false,
        result: [{
          location: { lat: 1, lng: 2 },
          logo: 'z.png',
          slug: 'store',
          zones: []
        }]
      }
    })
  })
  api.mockUsersSearchGet.mockImplementation((options = {}) => {
    if (options.cancelToken) options.cancelToken.cancel = vi.fn()
    return Promise.resolve({
      content: { result: [{ id: 20, cellphone: '5551234567', name: 'Pat' }] }
    })
  })
}

export function buildMockOrdering (vi, api) {
  const addressesApi = () => ({
    get: api.mockAddressGet,
    save: api.mockAddressSave,
    delete: api.mockAddressDelete
  })

  const mockOrdering = {
    appId: 'app',
    appInternalName: 'web',
    root: 'https://api.test',
    project: 'demo',
    setAccessToken: vi.fn(function () { return mockOrdering }),
    users: vi.fn(() => ({
      addresses: vi.fn((addressId) => (addressId != null
        ? addressesApi()
        : {
            get: api.mockAddressesListGet,
            save: api.mockAddressSave
          })),
      save: api.mockGuestSave,
      select: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      get: api.mockUsersSearchGet
    })),
    businesses: vi.fn((businessId) => {
      if (businessId != null) {
        return {
          select: vi.fn().mockReturnThis(),
          get: api.mockBusinessGet
        }
      }
      return {
        select: vi.fn().mockReturnThis(),
        parameters: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        get: api.mockBusinessZonesGet
      }
    })
  }

  return mockOrdering
}

export function createMockSocket (vi) {
  return {
    socket: { on: vi.fn(), connected: true },
    on: vi.fn(),
    off: vi.fn(),
    join: vi.fn(),
    leave: vi.fn(),
    getId: () => 'socket-10'
  }
}
