import { describe, it, expect, vi, beforeEach } from 'vitest'
import { waitFor } from '@testing-library/react'
import { renderController, lastControllerProps } from '../../../__tests__/helpers/renderController'

const auth = vi.hoisted(() => {
  const mockChangeUser = vi.fn()
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
  return { mockChangeUser, mockOrdering, mockSocket, reset }
})

vi.mock('../../../contexts/SessionContext', () => ({
  useSession: () => [{
    user: { id: 5, session_strategy: 'jwt_session' },
    token: 'tok',
    auth: true
  }, { changeUser: auth.mockChangeUser }]
}))

vi.mock('../../../contexts/ApiContext', () => ({
  useApi: () => [auth.mockOrdering]
}))

vi.mock('../../../contexts/ConfigContext', () => ({
  useConfig: () => [{ configs: {} }]
}))

vi.mock('../../../contexts/WebsocketContext', () => ({
  useWebsocket: () => auth.mockSocket
}))

import { UserVerification } from '../index'

describe('UserVerification', () => {
  beforeEach(() => auth.reset())

  it('exposes verification handlers', () => {
    renderController(UserVerification, {})
    expect(typeof lastControllerProps.sendVerifyEmailCode).toBe('function')
    expect(typeof lastControllerProps.sendVerifyPhoneCode).toBe('function')
    expect(typeof lastControllerProps.checkVerifyEmailCode).toBe('function')
  })

  it('sends email verification code', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: async () => ({ error: false, result: { id: 99 } })
    })
    renderController(UserVerification, {})
    await lastControllerProps.sendVerifyEmailCode({ email: 'user@test.com' })
    await waitFor(() => {
      expect(lastControllerProps.verifyEmailState.loadingSendCode).toBe(false)
    })
    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.test/codes/generate',
      expect.objectContaining({ method: 'POST' })
    )
    expect(lastControllerProps.verifyEmailState.resultSendCode).toEqual({ id: 99 })
  })

  it('checks email verification code', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: async () => ({ error: false, result: { verified: true } })
    })
    renderController(UserVerification, {})
    await lastControllerProps.checkVerifyEmailCode({ code: '123456' })
    await waitFor(() => {
      expect(lastControllerProps.verifyEmailState.loadingCheckCode).toBe(false)
    })
    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.test/users/5/verify',
      expect.objectContaining({ method: 'POST' })
    )
    expect(lastControllerProps.verifyEmailState.resultCheckCode).toEqual({ verified: true })
  })

  it('sends phone verification code', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: async () => ({ error: false, result: { id: 88 } })
    })
    renderController(UserVerification, {})
    await lastControllerProps.sendVerifyPhoneCode({ cellphone: '5551234', country_phone_code: '1' })
    await waitFor(() => {
      expect(lastControllerProps.verifyPhoneState.loadingSendCode).toBe(false)
    })
    expect(lastControllerProps.verifyPhoneState.resultSendCode).toEqual({ id: 88 })
  })

  it('checks phone verification code', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: async () => ({ error: false, result: { id: 5, cellphone: '5551234' } })
    })
    renderController(UserVerification, {})
    await lastControllerProps.checkVerifyPhoneCode({ code: '999999' })
    await waitFor(() => {
      expect(lastControllerProps.verifyPhoneState.loadingCheckCode).toBe(false)
    })
    expect(auth.mockChangeUser).toHaveBeenCalled()
  })
})
