import { describe, it, expect, vi } from 'vitest'
import { waitFor } from '@testing-library/react'
import { renderController, lastControllerProps } from '../../../__tests__/helpers/renderController'

const mockOrdering = {
  businesses: vi.fn(() => ({
    select: vi.fn().mockReturnThis(),
    parameters: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    asDashboard: vi.fn().mockReturnThis(),
    get: vi.fn().mockResolvedValue({
      content: {
        result: [{ id: 1, name: 'Store' }],
        error: false,
        pagination: { current_page: 1, page_size: 6, total_pages: 1, total: 1 }
      }
    })
  })),
  orders: vi.fn(() => ({
    parameters: vi.fn().mockReturnThis(),
    asDashboard: vi.fn().mockReturnThis(),
    get: vi.fn().mockResolvedValue({
      content: {
        result: [],
        error: false,
        pagination: { current_page: 1, page_size: 6, total_pages: 0, total: 0 }
      }
    })
  }))
}

vi.mock('../../../contexts/ApiContext', () => ({
  useApi: () => [mockOrdering]
}))

import { Contacts } from '../index'

describe('Contacts', () => {
  it('fetches businesses and passes contacts to UIComponent', async () => {
    renderController(Contacts, { firstFetch: 'businesses' })
    await waitFor(() => {
      expect(lastControllerProps.contacts.loading).toBe(false)
    })
    expect(lastControllerProps.contacts.data).toHaveLength(1)
    expect(typeof lastControllerProps.getBusinesses).toBe('function')
  })

  it('fetches orders when firstFetch is orders', async () => {
    renderController(Contacts, { firstFetch: 'orders' })
    await waitFor(() => {
      expect(lastControllerProps.orders.loading).toBe(false)
    })
    expect(lastControllerProps.orders.data).toEqual([])
    expect(typeof lastControllerProps.getOrders).toBe('function')
  })
})
