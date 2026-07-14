export const sampleProducts = [
  { id: 10, name: 'Burger', description: 'Tasty', price: 9.5, category_id: 1, rank: 2 },
  { id: 11, name: 'Fries', description: 'Crispy', price: 3.5, category_id: 1, rank: 1, featured: true }
]

export const sampleCategories = [
  {
    id: 1,
    name: 'Mains',
    products: sampleProducts,
    subcategories: []
  }
]

export const sampleBusiness = {
  id: 5,
  slug: 'taco-shop',
  name: 'Taco Shop',
  categories: sampleCategories,
  professionals: [{ id: 7, name: 'Chef' }]
}

export const sampleBusinessWithSubs = {
  ...sampleBusiness,
  categories: [
    {
      id: 2,
      name: 'Combos',
      products: [],
      subcategories: [
        { id: 3, name: 'Lunch', products: [{ id: 12, name: 'Combo', price: 11, featured: false }] }
      ]
    },
    ...sampleCategories
  ]
}

export const lazyBusiness = {
  ...sampleBusiness,
  lazy_load_products_recommended: true,
  categories: []
}

export const sampleMenus = [
  {
    id: 1,
    name: 'Lunch',
    business_id: 5,
    schedule: Array.from({ length: 7 }, (_, day) => ({
      enabled: day !== 6,
      lapses: day === 1
        ? [{ open: { hour: 9, minute: 0 }, close: { hour: 12, minute: 0 } }]
        : []
    }))
  }
]

export const withCancelToken = (vi, resolver) => vi.fn((options = {}) => {
  if (options.cancelToken) {
    options.cancelToken.cancel = vi.fn()
  }
  return resolver(options)
})

export function createMenuListingApiMocks (vi) {
  return {
    mockMenusGet: withCancelToken(vi, () => Promise.resolve({
      content: { error: false, result: sampleMenus }
    })),
    mockCategoriesGet: withCancelToken(vi, () => Promise.resolve({
      content: { error: false, result: sampleCategories }
    })),
    mockProductsGet: withCancelToken(vi, () => Promise.resolve({
      content: {
        error: false,
        result: sampleProducts,
        pagination: { current_page: 1, page_size: 15, total_pages: 1, total: 2 }
      }
    })),
    mockBusinessGet: withCancelToken(vi, () => Promise.resolve({
      content: { error: false, result: sampleBusiness }
    })),
    mockBusinessProductsListGet: withCancelToken(vi, () => Promise.resolve({
      content: { error: false, result: sampleProducts }
    })),
    mockProductGet: withCancelToken(vi, () => Promise.resolve({
      content: { error: false, result: { id: 10, name: 'Burger', extras: [] } }
    })),
    mockProductSave: vi.fn(),
    mockCategorySave: vi.fn()
  }
}

export function applyDefaultMenuListingMockImplementations (vi, api) {
  api.mockMenusGet.mockImplementation((options = {}) => {
    if (options.cancelToken) options.cancelToken.cancel = vi.fn()
    return Promise.resolve({ content: { error: false, result: sampleMenus } })
  })
  api.mockCategoriesGet.mockImplementation((options = {}) => {
    if (options.cancelToken) options.cancelToken.cancel = vi.fn()
    return Promise.resolve({ content: { error: false, result: sampleCategories } })
  })
  api.mockProductsGet.mockImplementation((options = {}) => {
    if (options.cancelToken) options.cancelToken.cancel = vi.fn()
    return Promise.resolve({
      content: {
        error: false,
        result: sampleProducts,
        pagination: { current_page: 1, page_size: 15, total_pages: 1, total: 2 }
      }
    })
  })
  api.mockBusinessGet.mockImplementation((options = {}) => {
    if (options.cancelToken) options.cancelToken.cancel = vi.fn()
    return Promise.resolve({ content: { error: false, result: sampleBusiness } })
  })
  api.mockBusinessProductsListGet.mockImplementation((options = {}) => {
    if (options.cancelToken) options.cancelToken.cancel = vi.fn()
    return Promise.resolve({ content: { error: false, result: sampleProducts } })
  })
  api.mockProductGet.mockImplementation((options = {}) => {
    if (options.cancelToken) options.cancelToken.cancel = vi.fn()
    return Promise.resolve({ content: { error: false, result: { id: 10, name: 'Burger', extras: [] } } })
  })
  api.mockProductSave.mockResolvedValue({
    content: { error: false, result: { id: 10, name: 'Burger', enabled: false } }
  })
  api.mockCategorySave.mockResolvedValue({
    content: { error: false, result: { id: 1, name: 'Mains', enabled: false } }
  })
}

export function buildMenuListingMockOrdering (vi, api) {
  const createProductsApi = (productId) => ({
    parameters: vi.fn(function () { return this }),
    where: vi.fn(function () { return this }),
    get: productId != null ? api.mockProductGet : api.mockProductsGet,
    save: api.mockProductSave
  })

  const createCategoriesApi = () => ({
    select: vi.fn(function () { return this }),
    parameters: vi.fn(function () { return this }),
    where: vi.fn(function () { return this }),
    get: api.mockCategoriesGet,
    products: vi.fn((productId) => createProductsApi(productId)),
    save: api.mockCategorySave
  })

  return {
    appId: 'app',
    appInternalName: 'web',
    root: 'https://api.test',
    project: 'demo',
    businesses: vi.fn((businessRef) => {
      const isSlug = typeof businessRef === 'string'
      return {
        select: vi.fn(function () { return this }),
        parameters: vi.fn(function () { return this }),
        where: vi.fn(function () { return this }),
        asDashboard: vi.fn(function () { return this }),
        menus: vi.fn(() => ({
          select: vi.fn(function () { return this }),
          where: vi.fn(function () { return this }),
          get: api.mockMenusGet
        })),
        categories: vi.fn(() => createCategoriesApi()),
        get: isSlug ? api.mockBusinessGet : api.mockBusinessProductsListGet
      }
    })
  }
}

export const defaultOrderState = {
  loading: false,
  options: {
    type: 1,
    address: { location: { lat: 40.7, lng: -74 } }
  }
}

export function setupMenuListingFetchMock (vi) {
  global.fetch = vi.fn().mockResolvedValue({
    json: async () => ({ error: false, result: {} })
  })
}
