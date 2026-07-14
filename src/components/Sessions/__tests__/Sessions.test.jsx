import { describe, it, expect, vi, beforeEach } from 'vitest'
import { waitFor } from '@testing-library/react'
import { renderController, lastControllerProps } from '../../../__tests__/helpers/renderController'

const auth = vi.hoisted(() => {
  const mockOrdering = {
    appId: 'app',
    appInternalName: 'web',
    root: 'https://api.test',
    setAccessToken: vi.fn(function () { return mockOrdering })
  }
  const mockSocket = {
    socket: { connected: true, on: vi.fn(), off: vi.fn() },
    getId: () => 'socket-1'
  }
  const reset = () => {
    vi.clearAllMocks()
    global.fetch = vi.fn().mockResolvedValue({
      json: async () => ({ error: false, result: [] })
    })
  }
  return { mockOrdering, mockSocket, reset }
})

vi.mock('../../../contexts/SessionContext', () => ({
  useSession: () => [{
    user: { id: 5, session_strategy: 'jwt_session' },
    token: 'tok',
    auth: true
  }, { login: vi.fn(), logout: vi.fn() }]
}))

vi.mock('../../../contexts/ApiContext', () => ({
  useApi: () => [auth.mockOrdering]
}))

vi.mock('../../../contexts/WebsocketContext', () => ({
  useWebsocket: () => auth.mockSocket
}))

import { Sessions } from '../index'

describe('Sessions', () => {
  beforeEach(() => auth.reset())

  it('loads sessions for jwt_session users', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: async () => ({ error: false, result: [{ id: 10, created_at: '2024-01-01' }] })
    })
    renderController(Sessions, {})
    await waitFor(() => {
      expect(lastControllerProps.sessionsList.loading).toBe(false)
    })
    expect(lastControllerProps.sessionsList.sessions).toHaveLength(1)
    expect(typeof lastControllerProps.handleDeleteSession).toBe('function')
  })

  it('sorts sessions by date when sortByDate is set', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: async () => ({
        error: false,
        result: [
          { id: 1, created_at: '2024-02-01' },
          { id: 2, created_at: '2024-01-01' }
        ]
      })
    })
    renderController(Sessions, { sortByDate: 'asc' })
    await waitFor(() => {
      expect(lastControllerProps.sessionsList.sessions[0].id).toBe(2)
    })
  })

  it('deletes a session via API', async () => {
    global.fetch = vi.fn()
      .mockResolvedValueOnce({
        json: async () => ({ error: false, result: [{ id: 10, created_at: '2024-01-01' }] })
      })
      .mockResolvedValueOnce({
        json: async () => ({ error: false, result: {} })
      })
    renderController(Sessions, {})
    await waitFor(() => {
      expect(lastControllerProps.sessionsList.sessions).toHaveLength(1)
    })
    await lastControllerProps.handleDeleteSession({ id: 10, current: false })
    await waitFor(() => {
      expect(lastControllerProps.sessionsList.sessions).toHaveLength(0)
    })
  })

  it('stores API error when session fetch fails', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: async () => ({ error: true, result: ['denied'] })
    })
    renderController(Sessions, {})
    await waitFor(() => {
      expect(lastControllerProps.sessionsList.loading).toBe(false)
    })
    expect(lastControllerProps.sessionsList.error).toEqual(['denied'])
  })
})
