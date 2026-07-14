export const sampleProduct = {
  id: 10,
  name: 'Burger',
  price: 9.5,
  category_id: 1,
  maximum_per_order: 10,
  minimum_per_order: 1,
  ingredients: {
    1: { id: 1, name: 'Lettuce' }
  },
  extras: [{
    options: [{
      id: 20,
      name: 'Size',
      min: 1,
      max: 1,
      rank: 1,
      extra: { rank: 1 },
      suboptions: [{
        id: 201,
        name: 'Large',
        price: 2,
        preselected: true,
        rank: 1
      }]
    }]
  }]
}

export const productForComponent = {
  id: 10,
  name: 'Burger',
  price: 9.5,
  images: 'burger.png',
  ingredients: [{ id: 1, name: 'Lettuce' }],
  extras: [{
    options: [{
      id: 20,
      name: 'Size',
      suboptions: [{ id: 201, name: 'Large', price: 2 }]
    }]
  }]
}

export const withCancelToken = (vi, resolver) => vi.fn((options = {}) => {
  if (options.cancelToken) {
    options.cancelToken.cancel = vi.fn()
  }
  return resolver(options)
})

export function createProductDetailApiMocks (vi) {
  return {
    mockProductGet: withCancelToken(vi, () => Promise.resolve({
      content: { error: false, result: sampleProduct }
    })),
    mockGuestSave: vi.fn().mockResolvedValue({
      content: { error: false, result: { id: 99, session: { access_token: 'guest' } } }
    })
  }
}

export function applyDefaultProductDetailMockImplementations (vi, api) {
  api.mockProductGet.mockImplementation((options = {}) => {
    if (options.cancelToken) options.cancelToken.cancel = vi.fn()
    return Promise.resolve({ content: { error: false, result: sampleProduct } })
  })
}

export function buildProductDetailMockOrdering (vi, api) {
  return {
    appId: 'app',
    appInternalName: 'web',
    root: 'https://api.test',
    project: 'demo',
    users: vi.fn(() => ({
      save: api.mockGuestSave
    })),
    businesses: vi.fn(() => ({
      select: vi.fn(function () { return this }),
      parameters: vi.fn(function () { return this }),
      categories: vi.fn(() => ({
        products: vi.fn(() => ({
          parameters: vi.fn(function () { return this }),
          get: api.mockProductGet
        }))
      })),
      get: vi.fn().mockResolvedValue({
        content: { error: false, result: { id: 5, professionals: [] } }
      })
    }))
  }
}

export const defaultOrderState = {
  loading: false,
  options: { type: 1 },
  carts: {
    'businessId:5': { business_id: 5, products: [] }
  }
}

export function setupProductDetailFetchMock (vi) {
  global.fetch = vi.fn().mockResolvedValue({
    json: async () => ({ error: false, result: {} })
  })
}

export const productFormBaseProps = {
  businessId: 5,
  categoryId: 1,
  productId: 10,
  product: sampleProduct,
  useOrderContext: false
}
