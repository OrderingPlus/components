import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ApiBase } from '../ApiBase'

class TestApi extends ApiBase {
  async request (method, url, data, model, options) {
    return this.makeRequest(method, url, data, model, options)
  }
}

describe('ApiBase', () => {
  const ordering = {
    get: vi.fn().mockResolvedValue('get-response'),
    post: vi.fn().mockResolvedValue('post-response'),
    put: vi.fn().mockResolvedValue('put-response'),
    delete: vi.fn().mockResolvedValue('delete-response')
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('chains query builder methods', () => {
    const api = new TestApi(ordering)
    const chained = api
      .select(['id', 'name'])
      .where([{ attribute: 'enabled', value: true }])
      .setMode('dashboard')
      .asDictionary()
      .parameters({ page: 1 })

    expect(chained).toBe(api)
    expect(api.attributes).toEqual(['id', 'name'])
    expect(api.conditions).toEqual([{ attribute: 'enabled', value: true }])
    expect(api.mode).toBe('dictionary')
    expect(api.query).toEqual({ page: 1 })
  })

  it('delegates GET requests with merged query options', async () => {
    const api = new TestApi(ordering)
    api.select(['id']).where([{ attribute: 'x', value: 1 }]).parameters({ page: 2 })
    await api.request('GET', '/items', { extra: 'y' }, null, { headers: { A: '1' } })
    expect(ordering.get).toHaveBeenCalledWith('/items', expect.objectContaining({
      attributes: ['id'],
      conditions: [{ attribute: 'x', value: 1 }],
      query: { page: 2, extra: 'y' },
      headers: { A: '1' },
      api
    }))
  })

  it('delegates POST/PUT/DELETE methods', async () => {
    const api = new TestApi(ordering)
    await api.request('POST', '/items', { a: 1 })
    await api.request('PUT', '/items/1', { a: 2 })
    await api.request('DELETE', '/items/1')
    expect(ordering.post).toHaveBeenCalled()
    expect(ordering.put).toHaveBeenCalled()
    expect(ordering.delete).toHaveBeenCalled()
  })

  it('throws for unsupported HTTP method', async () => {
    const api = new TestApi(ordering)
    await expect(api.request('PATCH', '/items')).rejects.toThrow('methos is not supported')
  })
})
