import { vi } from 'vitest'
import { Ordering } from '../../sdk/lib/classes/Ordering'

export const createMockOrdering = (overrides = {}) => {
  const ordering = new Ordering({ project: 'demo', ...overrides })
  ordering.get = vi.fn().mockResolvedValue({ content: { error: false, result: { id: 1 } } })
  ordering.post = vi.fn().mockResolvedValue({ content: { error: false, result: { id: 2 } } })
  ordering.put = vi.fn().mockResolvedValue({ content: { error: false, result: { id: 3 } } })
  ordering.delete = vi.fn().mockResolvedValue({ content: { error: false, result: {} } })
  return ordering
}
