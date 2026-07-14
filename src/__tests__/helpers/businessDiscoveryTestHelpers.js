export const sampleBusiness = {
  id: 5,
  name: 'Taco Shop',
  slug: 'taco-shop',
  location: { lat: 40.71, lng: -74.01 },
  logo: 'logo.png',
  reviews: { total: 12 },
  offers: [{ rate: 10, rate_type: 1 }, { rate: 5, rate_type: 2 }],
  schedule: [{ day: 'monday' }],
  gallery: [
    { file: 'photo.jpg' },
    { video: 'clip.mp4' }
  ],
  address: '100 Broadway',
  address_notes: 'Suite 1',
  today: { enabled: true, lapses: [{ open: { hour: 9, minute: 0 }, close: { hour: 22, minute: 0 } }] },
  timezone: 'America/New_York'
}

export const withCancelToken = (vi, resolver) => vi.fn((options = {}) => {
  if (options.cancelToken) {
    options.cancelToken.cancel = vi.fn()
  }
  return resolver(options)
})

export function createBusinessApiMocks (vi) {
  return {
    mockBusinessGet: withCancelToken(vi, () => Promise.resolve({
      content: { error: false, result: { id: 3, name: 'Loaded Store', slug: 'loaded' } }
    })),
    mockBusinessSave: vi.fn(),
    mockBusinessesListGet: withCancelToken(vi, () => Promise.resolve({
      content: {
        error: false,
        result: [{ id: 1, name: 'SDK Store', slug: 'sdk' }],
        pagination: { current_page: 1, page_size: 10, total_pages: 1, total: 1 }
      }
    }))
  }
}

export function applyDefaultBusinessMockImplementations (vi, api) {
  api.mockBusinessGet.mockImplementation((options = {}) => {
    if (options.cancelToken) options.cancelToken.cancel = vi.fn()
    return Promise.resolve({
      content: { error: false, result: { id: 3, name: 'Loaded Store', slug: 'loaded' } }
    })
  })
  api.mockBusinessSave.mockResolvedValue({
    content: { error: false, result: { id: 3, name: 'Updated Store' } }
  })
  api.mockBusinessesListGet.mockImplementation((options = {}) => {
    if (options.cancelToken) options.cancelToken.cancel = vi.fn()
    return Promise.resolve({
      content: {
        error: false,
        result: [{ id: 1, name: 'SDK Store', slug: 'sdk' }],
        pagination: { current_page: 1, page_size: 10, total_pages: 1, total: 1 }
      }
    })
  })
}

export function buildBusinessMockOrdering (vi, api) {
  const mockOrdering = {
    appId: 'app',
    appInternalName: 'web',
    root: 'https://api.test',
    project: 'demo',
    setAccessToken: vi.fn(function () { return mockOrdering }),
    businesses: vi.fn((businessId) => {
      if (businessId != null) {
        return {
          select: vi.fn().mockReturnThis(),
          parameters: vi.fn().mockReturnThis(),
          save: api.mockBusinessSave,
          get: api.mockBusinessGet
        }
      }
      return {
        select: vi.fn().mockReturnThis(),
        parameters: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        asDashboard: vi.fn().mockReturnThis(),
        get: api.mockBusinessesListGet
      }
    })
  }
  return mockOrdering
}

export function createBusinessMockSocket (vi) {
  return {
    socket: { on: vi.fn(), connected: true },
    on: vi.fn(),
    off: vi.fn(),
    join: vi.fn(),
    leave: vi.fn(),
    getId: () => 'socket-11'
  }
}

export function setupFetchMock (vi) {
  global.fetch = vi.fn((url) => {
    if (String(url).includes('/businesses')) {
      return Promise.resolve({
        json: async () => ({
          error: false,
          result: [{ id: 1, name: 'Pizza Place', slug: 'pizza', location: { lat: 40.7, lng: -74 }, reviews: { total: 10 }, offers: [] }],
          pagination: { current_page: 1, page_size: 10, total_pages: 1, total: 1 }
        })
      })
    }
    if (String(url).includes('/franchises')) {
      return Promise.resolve({
        json: async () => ({ error: false, result: [{ id: 1, name: 'Brand A' }] })
      })
    }
    if (String(url).includes('/countries')) {
      return Promise.resolve({
        json: async () => ({ error: false, result: [{ cities: [{ id: 1, name: 'NYC' }] }] })
      })
    }
    if (String(url).includes('/search')) {
      return Promise.resolve({
        json: async () => ({
          error: false,
          result: [{ id: 2, name: 'Burger Joint', city_id: 1, categories: [{ id: 9, products: [{ id: 44, name: 'Burger' }] }] }],
          pagination: { current_page: 1, page_size: 25, total_pages: 1, total: 1 }
        })
      })
    }
    if (String(url).includes('/business_types')) {
      return Promise.resolve({
        json: async () => ({
          error: false,
          result: [{ id: 1, name: 'Restaurant', enabled: true }],
          pagination: {}
        })
      })
    }
    if (String(url).includes('/tracking_events')) {
      return Promise.resolve({ json: async () => ({ error: false }) })
    }
    if (String(url).includes('/favorite_businesses')) {
      return Promise.resolve({ json: async () => ({ error: false, result: {} }) })
    }
    return Promise.resolve({ json: async () => ({ error: false, result: [] }) })
  })
}

export function setupGoogleMaps (vi) {
  class LatLng {
    constructor (lat, lng) {
      this._lat = lat
      this._lng = lng
    }

    lat () { return this._lat }
    lng () { return this._lng }
  }

  class LatLngBounds {
    constructor () {
      this._points = []
    }

    extend (pos) {
      this._points.push(pos)
    }

    isEmpty () {
      return this._points.length === 0
    }
  }

  window.google = {
    maps: {
      LatLng,
      LatLngBounds,
      Size: vi.fn((w, h) => ({ w, h })),
      Marker: vi.fn(function (opts) {
        return {
          setMap: vi.fn(),
          getPosition: () => opts.position,
          addListener: vi.fn()
        }
      }),
      InfoWindow: vi.fn(() => ({
        setContent: vi.fn(),
        open: vi.fn(),
        close: vi.fn(),
        addListener: vi.fn()
      })),
      Map: vi.fn(() => ({
        fitBounds: vi.fn(),
        setCenter: vi.fn(),
        setZoom: vi.fn()
      }))
    }
  }
}

export const defaultOrderState = {
  loading: false,
  options: {
    type: 1,
    user_id: 8,
    address: { location: { lat: 40.7, lng: -74 }, address: '123 Main' }
  }
}

export function discoveryConfigs (state) {
  return {
    location_default_latitude: { value: '40.7' },
    location_default_longitude: { value: '-74.0' },
    advanced_business_search_enabled: { value: state.testAdvancedSearch },
    unaddressed_order_types_allowed: { value: '2|3' }
  }
}
