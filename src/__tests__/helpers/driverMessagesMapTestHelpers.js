export const sampleDriver = {
  id: 4,
  name: 'Driver',
  lastname: 'One',
  level: 4,
  email: 'driver@test.com'
}

export const sampleOrder = {
  id: 101,
  status: 1,
  customer_id: 8,
  business_id: 5,
  driver: { id: 4, name: 'Driver One' },
  products: [{
    calendar_event: { professional: { id: 9, name: 'Pro' } }
  }]
}

export const dashboardOrder = {
  id: 101,
  status: 3,
  business_id: 5,
  customer_id: 8
}

export const mockT = (key, fallback) => fallback || key

export function createInitialOrderState () {
  return {
    loading: false,
    options: { type: 1 },
    carts: {
      'businessId:5': { business_id: 5, driver_tip: 2, driver_tip_rate: 15 },
      'businessId:6': { business_id: 6, driver_tip: 0, driver_tip_rate: 0 },
      'businessId:7': { business_id: 7, driver_tip: 0, driver_tip_rate: 0 }
    }
  }
}

export function createInitialConfigState () {
  return {
    driver_tip_type: { value: '2' },
    driver_tip_use_custom: { value: '0' }
  }
}

export function createDriverMessagesMapApiMocks (vi) {
  return {
    mockUsersGet: vi.fn(),
    mockOrdersDashboardGet: vi.fn(),
    mockDriverLocationsSave: vi.fn()
  }
}

export function buildDriverMessagesMapMockOrdering (vi, api) {
  const usersApiChain = {
    select: vi.fn(function () { return usersApiChain }),
    where: vi.fn(function () { return usersApiChain }),
    get: (...args) => api.mockUsersGet(...args)
  }

  const ordersDashboardChain = {
    asDashboard: vi.fn(function () { return ordersDashboardChain }),
    get: (...args) => api.mockOrdersDashboardGet(...args)
  }

  return {
    appId: 'app',
    appInternalName: 'web',
    root: 'https://api.test',
    project: 'demo',
    setAccessToken: vi.fn(() => ({
      orders: vi.fn(() => ordersDashboardChain),
      users: vi.fn(() => ({
        driverLocations: vi.fn(() => ({
          save: (...args) => api.mockDriverLocationsSave(...args)
        }))
      }))
    })),
    users: vi.fn(() => usersApiChain),
    countries: vi.fn(() => ({
      get: vi.fn().mockResolvedValue({
        response: {
          data: {
            result: [{
              id: 1,
              name: 'USA',
              cities: [{
                id: 10,
                name: 'New York',
                options: [{ id: 100, name: 'Manhattan' }]
              }]
            }]
          }
        }
      })
    }))
  }
}

export function createDriverMessagesMapFetchMock (vi) {
  return vi.fn(async (url, options = {}) => {
    const method = options.method || 'GET'
    if (url.includes('/users/4/user_reviews') && method === 'POST') {
      return { json: async () => ({ error: false, result: { id: 1, order_id: 101 } }) }
    }
    if (url.includes('/users/9/user_reviews') && method === 'POST') {
      return { json: async () => ({ error: false, result: { id: 2, order_id: 101 } }) }
    }
    if (url.includes('/users/8/user_reviews') && method === 'POST') {
      return { json: async () => ({ error: false, result: { id: 3, order_id: 101, rating: 5 } }) }
    }
    if (url.includes('/orders/101/messages') && method === 'POST') {
      return { json: async () => ({ error: false, result: { id: 10, comment: 'Hello' } }) }
    }
    return { json: async () => ({ error: false, result: {} }) }
  })
}

export function createMockSocket (vi) {
  return {
    socket: { on: vi.fn(), connected: true },
    getId: () => 'socket-17',
    on: vi.fn(),
    off: vi.fn(),
    join: vi.fn(),
    leave: vi.fn()
  }
}

export function setupGoogleMapsMock (vi) {
  const listeners = new globalThis.Map()

  const LatLngFn = function (lat, lng) {
    this.lat = () => lat
    this.lng = () => lng
  }

  class LatLngBounds {
    constructor () {
      this.empty = false
    }

    extend () {}
    union () {}
    isEmpty () { return this.empty }
  }

  class Marker {
    constructor ({ position }) {
      this.position = position
      this.title = ''
      this._map = null
    }

    setMap (map) { this._map = map }
    setPosition (pos) { this.position = pos }
    getPosition () { return this.position }
    addListener () {
      return { remove: vi.fn() }
    }
  }

  class GoogleMapMock {
    constructor () {
      this._center = { lat: 0, lng: 0 }
      this._zoom = 12
    }

    panTo () {}
    getCenter () { return new LatLngFn(this._center.lat, this._center.lng) }
    getZoom () { return this._zoom }
    setZoom (z) { this._zoom = z }
    fitBounds () {}
  }

  class Circle {
    setMap () {}
    getBounds () { return new LatLngBounds() }
  }

  class Polygon {
    setMap () {}
  }

  class InfoWindow {
    setContent () {}
    open () {}
    close () {}
  }

  window.google = {
    maps: {
      Map: GoogleMapMock,
      Marker,
      LatLng: LatLngFn,
      LatLngBounds,
      Circle,
      Polygon,
      InfoWindow,
      Size: function () {},
      Geocoder: function () {
        return {
          geocode: (_opts, cb) => {
            cb([{
              formatted_address: '123 Main St',
              address_components: [
                { types: ['postal_code'], short_name: '10001' },
                { types: ['street_number'], long_name: '123' },
                { types: ['route'], long_name: 'Main St' },
                { types: ['locality'], long_name: 'New York' },
                { types: ['country'], long_name: 'USA', short_name: 'US' },
                { types: ['administrative_area_level_1'], long_name: 'NY', short_name: 'NY' }
              ]
            }])
          }
        }
      },
      MapTypeControlStyle: { HORIZONTAL_BAR: 0 },
      ControlPosition: { TOP_LEFT: 0 },
      event: {
        addListener: vi.fn((target, event, cb) => {
          listeners.set(`${event}`, cb)
          return { remove: vi.fn() }
        }),
        addListenerOnce: vi.fn((target, event, cb) => {
          if (event === 'idle') cb()
        }),
        clearListeners: vi.fn()
      },
      geometry: {
        spherical: {
          computeDistanceBetween: () => 1000
        }
      }
    }
  }
}

export function createDriverMessagesMapTestContext (vi) {
  const api = createDriverMessagesMapApiMocks(vi)
  const mockOrderState = createInitialOrderState()
  const mockConfigState = createInitialConfigState()
  const mockSocket = createMockSocket(vi)

  const mocks = {
    mockShowToast: vi.fn(),
    mockEmit: vi.fn(),
    mockEventsOn: vi.fn(),
    mockEventsOff: vi.fn(),
    mockChangeDriverTip: vi.fn(),
    mockHandlerFindBusiness: vi.fn(),
    mockHandlerChangeDriverOption: vi.fn(),
    mockOnClose: vi.fn(),
    mockCustomHandleSend: vi.fn(),
    mockSetMessages: vi.fn(),
    mockOnBusinessClick: vi.fn(),
    mockHandleChangeAddressMap: vi.fn(),
    mockSetErrors: vi.fn(),
    mockSetNearBusinessList: vi.fn()
  }

  const reset = () => {
    vi.clearAllMocks()
    Object.assign(mockOrderState, createInitialOrderState())
    Object.assign(mockConfigState, createInitialConfigState())
    global.fetch = createDriverMessagesMapFetchMock(vi)
    setupGoogleMapsMock(vi)

    api.mockUsersGet.mockResolvedValue({
      content: { error: false, result: [sampleDriver] }
    })
    api.mockOrdersDashboardGet.mockResolvedValue({
      content: { error: false, result: [dashboardOrder, { ...dashboardOrder, id: 102, business_id: 6 }] }
    })
    api.mockDriverLocationsSave.mockResolvedValue({
      content: { error: false, result: { lat: 10, lng: 20 } }
    })
    mockConfigState.driver_tip_type.value = '2'
    mockConfigState.driver_tip_use_custom.value = '0'
  }

  return {
    ...api,
    ...mocks,
    mockOrderState,
    mockConfigState,
    mockSocket,
    mockOrdering: buildDriverMessagesMapMockOrdering(vi, api),
    reset,
    sampleDriver,
    sampleOrder,
    dashboardOrder,
    mockT,
    setupGoogleMapsMock: () => setupGoogleMapsMock(vi)
  }
}
