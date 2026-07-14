import { describe, it, expect } from 'vitest'
import { Pagination } from '../Pagination'

describe('Pagination', () => {
  it('maps pagination fields from API payload', () => {
    const pagination = new Pagination({
      back_page: 1,
      current_page: 2,
      fisrt_page: 1,
      from: 11,
      last_page: 5,
      next_page: 3,
      page_size: 10,
      to: 20,
      total: 50,
      total_pages: 5
    })
    expect(pagination.current_page).toBe(2)
    expect(pagination.total).toBe(50)
    expect(pagination.page_size).toBe(10)
  })
})
