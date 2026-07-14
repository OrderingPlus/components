import { describe, it, expect, vi, beforeEach } from 'vitest'
import { waitFor } from '@testing-library/react'
import { renderController, lastControllerProps } from '../../../__tests__/helpers/renderController'

const auth = vi.hoisted(() => {
  const mockOrdering = {
    appId: 'app',
    appInternalName: 'web',
    root: 'https://api.test'
  }
  const reset = () => {
    vi.clearAllMocks()
    global.fetch = vi.fn().mockResolvedValue({
      json: async () => ({ error: false, result: [] })
    })
  }
  return { mockOrdering, reset }
})

vi.mock('../../../contexts/SessionContext', () => ({
  useSession: () => [{ user: { id: 5 }, token: 'tok', auth: true }]
}))

vi.mock('../../../contexts/ApiContext', () => ({
  useApi: () => [auth.mockOrdering]
}))

vi.mock('../../../contexts/OrderContext', () => ({
  useOrder: () => [{ options: { type: 1 } }, { setStateValues: vi.fn() }]
}))

import { LoginGuest } from '../index'

describe('LoginGuest', () => {
  beforeEach(() => auth.reset())

  it('loads checkout validation fields', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: async () => ({ error: false, result: [{ id: 1 }] })
    })
    renderController(LoginGuest, {})
    await waitFor(() => {
      expect(lastControllerProps.checkoutFieldsState.loading).toBe(false)
    })
    expect(lastControllerProps.checkoutFieldsState.fields).toHaveLength(1)
  })
})
