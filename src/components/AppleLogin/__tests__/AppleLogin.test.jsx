import { describe, it, expect, vi, beforeEach } from 'vitest'
import { waitFor } from '@testing-library/react'
import { renderController, lastControllerProps } from '../../../__tests__/helpers/renderController'
import { setupApple, resetSocialAuthDom } from '../../../__tests__/helpers/socialAuthTestHelpers'

const social = vi.hoisted(() => {
  const mockOrdering = {
    appId: 'app',
    appInternalName: 'web',
    root: 'https://api.test'
  }
  const reset = () => {
    vi.clearAllMocks()
    resetSocialAuthDom()
    global.fetch = vi.fn().mockResolvedValue({
      json: async () => ({
        error: false,
        result: { id: 12, session: { access_token: 'apple-tok' } }
      })
    })
  }
  return { mockOrdering, reset }
})

vi.mock('../../../contexts/ApiContext', () => ({
  useApi: () => [social.mockOrdering]
}))

vi.mock('../../../contexts/SessionContext', () => ({
  useSession: () => [{ user: { id: 3 } }, { login: vi.fn() }]
}))

vi.mock('../../../contexts/ConfigContext', () => ({
  useConfig: () => [{
    configs: { apple_login_client_id: { value: 'apple.client' } }
  }]
}))

vi.mock('../../../contexts/WebsocketContext', () => ({
  useWebsocket: () => ({ getId: () => 'socket-9' })
}))

import { AppleLogin } from '../index'

describe('AppleLogin', () => {
  beforeEach(() => social.reset())

  it('exposes initLoginApple and loads apple script', () => {
    renderController(AppleLogin, {})
    expect(typeof lastControllerProps.initLoginApple).toBe('function')
    expect(document.getElementById('apple-login')).toBeTruthy()
  })

  it('delegates to handleButtonAppleLoginClick when provided', async () => {
    const handleButtonAppleLoginClick = vi.fn()
    renderController(AppleLogin, { handleButtonAppleLoginClick })
    const handler = lastControllerProps.initLoginApple
    setupApple()
    handler()
    await waitFor(() => {
      expect(handleButtonAppleLoginClick).toHaveBeenCalledWith({ code: 'apple-code' })
    })
  })

  it('posts apple code to auth endpoint on success', async () => {
    const onSuccess = vi.fn()
    renderController(AppleLogin, { onSuccess })
    setupApple()
    lastControllerProps.initLoginApple()
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.test/auth/apple',
        expect.objectContaining({ method: 'POST' })
      )
    })
    expect(onSuccess).toHaveBeenCalled()
  })
})
