import { describe, it, expect } from 'vitest'
import { ApiResponse } from '../ApiResponse'
import { Pagination } from '../Pagination'
import { Cart } from '../../models/Cart'

describe('ApiResponse', () => {
  it('returns raw data when json option is disabled', () => {
    const response = new ApiResponse({ data: 'plain', status: 200 }, { json: false })
    expect(response.content).toBe('plain')
    expect(response.status).toBe(200)
  })

  it('wraps pagination and single result with CastClass', () => {
    const apiResponse = new ApiResponse({
      status: 200,
      data: {
        error: false,
        pagination: { current_page: 1, total: 1 },
        result: { id: 7, name: 'Cart A' }
      }
    }, { json: true, CastClass: Cart }, null)

    const content = apiResponse.content
    expect(content.pagination).toBeInstanceOf(Pagination)
    expect(content.result).toBeInstanceOf(Cart)
    expect(content.result.id).toBe(7)
  })

  it('casts array results', () => {
    const apiResponse = new ApiResponse({
      status: 200,
      data: {
        error: false,
        result: [{ id: 1 }, { id: 2 }]
      }
    }, { json: true, CastClass: Cart })

    const content = apiResponse.content
    expect(content.result).toHaveLength(2)
    expect(content.result[0]).toBeInstanceOf(Cart)
  })

  it('casts dictionary mode results', () => {
    const apiResponse = new ApiResponse({
      status: 200,
      data: {
        error: false,
        result: {
          KEY_ONE: { id: 1 },
          KEY_TWO: 'literal'
        }
      }
    }, { json: true, CastClass: Cart, mode: 'dictionary' })

    const content = apiResponse.content
    expect(content.result.KEY_ONE).toBeInstanceOf(Cart)
    expect(content.result.KEY_TWO).toBe('literal')
  })
})
