import { describe, it, expect, vi, beforeEach } from 'vitest'
import { waitFor } from '@testing-library/react'
import { renderController, lastControllerProps } from '../../../__tests__/helpers/renderController'

const auth = vi.hoisted(() => {
  const mockLogin = vi.fn()
  const state = { sessionAuth: true }
  const mockOrdering = {
    appId: 'app',
    appInternalName: 'web',
    root: 'https://api.test'
  }
  const reset = () => {
    state.sessionAuth = true
    vi.clearAllMocks()
    global.fetch = vi.fn().mockResolvedValue({
      json: async () => ({ error: false, result: [] })
    })
  }
  return { mockLogin, state, mockOrdering, reset }
})

vi.mock('../../../contexts/SessionContext', () => ({
  useSession: () => [{
    user: { id: 5 },
    token: 'tok',
    auth: auth.state.sessionAuth
  }, { login: auth.mockLogin }]
}))

vi.mock('../../../contexts/ApiContext', () => ({
  useApi: () => [auth.mockOrdering]
}))

vi.mock('../../../contexts/EventContext', async (importOriginal) => {
  const actual = await importOriginal()
  return { ...actual, useEvent: () => [{ emit: vi.fn() }] }
})

vi.mock('../../../contexts/OrderContext', () => ({
  useOrder: () => [{ options: { type: 1 } }, { setStateValues: vi.fn() }]
}))

vi.mock('../../../contexts/SiteContext', () => ({
  useSite: () => [{ site: { business_url_template: '/store/:business_slug' } }]
}))

import { QueryLoginSpoonity } from '../index'

describe('QueryLoginSpoonity', () => {
  beforeEach(() => auth.reset())

  it('renders with userState when unauthenticated without token', () => {
    renderController(QueryLoginSpoonity, { token: null })
    expect(lastControllerProps.userState).toBeDefined()
    expect(typeof lastControllerProps.setAuthModalOpen).toBe('function')
  })

  it('fetches spoonity user when token is present', async () => {
    auth.state.sessionAuth = false
    global.fetch = vi.fn().mockResolvedValue({
      json: async () => ({
        error: false,
        result: { id: 7, session: { access_token: 'spoon-tok' } }
      })
    })
    renderController(QueryLoginSpoonity, { token: 'spoon-token' })
    await waitFor(() => {
      expect(lastControllerProps.userState.loading).toBe(false)
    })
    expect(auth.mockLogin).toHaveBeenCalled()
  })

  it('opens login modal when spoonity auth fails', async () => {
    auth.state.sessionAuth = false
    global.fetch = vi.fn().mockResolvedValue({
      json: async () => ({ error: true, result: ['invalid token'] })
    })
    renderController(QueryLoginSpoonity, { token: 'bad-token' })
    await waitFor(() => {
      expect(lastControllerProps.authModalOpen).toBe(true)
    })
    expect(lastControllerProps.modalPageToShow).toBe('login')
  })
})
