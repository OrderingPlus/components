import { describe, it, expect, vi } from 'vitest'
import { Model } from '../Model'

class TestModel extends Model {
  constructor (data = {}, api) {
    super(data, api)
    Object.entries(data).forEach(([key, value]) => {
      this[key] = value
    })
  }

  getId () {
    return this.id
  }
}

describe('Model', () => {
  it('stores original values and api reference', () => {
    const api = { save: vi.fn() }
    const model = new TestModel({ id: 1, name: 'A' }, api)
    expect(model.id).toBe(1)
    expect(model.name).toBe('A')
    expect(model.api).toBe(api)
  })

  it('setApi updates api reference', () => {
    const model = new TestModel({ id: 1 }, null)
    const api = { save: vi.fn() }
    model.setApi(api)
    expect(model.api).toBe(api)
  })

  it('save throws when api is missing', async () => {
    const model = new TestModel({ id: 1, name: 'A' }, null)
    await expect(model.save()).rejects.toThrow()
  })

  it('save returns current model when there are no changes', async () => {
    const api = { setModelId: vi.fn(), save: vi.fn() }
    const model = new TestModel({ id: 1, name: 'A' }, api)
    const result = await model.save()
    expect(api.save).not.toHaveBeenCalled()
    expect(result).toEqual({ error: false, result: model })
  })

  it('save persists changed attributes', async () => {
    const api = {
      setModelId: vi.fn(),
      save: vi.fn().mockResolvedValue({
        content: { error: false, result: { id: 1, name: 'B' } }
      })
    }
    const model = new TestModel({ id: 1, name: 'A' }, api)
    model.name = 'B'
    const result = await model.save()
    expect(api.setModelId).toHaveBeenCalledWith(1)
    expect(api.save).toHaveBeenCalledWith({ name: 'B' })
    expect(model.name).toBe('B')
    expect(result.error).toBe(false)
  })
})
