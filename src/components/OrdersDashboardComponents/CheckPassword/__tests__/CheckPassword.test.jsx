import { describe, it, expect, vi, beforeEach } from 'vitest'
import { act } from '@testing-library/react'
import { renderController, lastControllerProps } from '../../../../__tests__/helpers/renderController'

const d2 = vi.hoisted(() => {
  const { createDashboardUsersTestContext } = require('../../../../__tests__/helpers/dashboardUsersTestHelpers')
  return createDashboardUsersTestContext(vi)
})

vi.mock('../../../../contexts/SessionContext', () => ({
  useSession: () => [d2.mockSessionState, { changeUser: vi.fn() }]
}))

vi.mock('../../../../contexts/ApiContext', () => ({
  useApi: () => [d2.mockOrdering]
}))

import { CheckPassword } from '../index'

describe('CheckPassword', () => {
  beforeEach(() => d2.reset())

  it('switches confirm tab', () => {
    renderController(CheckPassword, {})
    act(() => {
      lastControllerProps.handleChangeTab('otp')
    })
    expect(lastControllerProps.confirmTab).toBe('otp')
  })

  it('updates credential fields', () => {
    renderController(CheckPassword, {})
    act(() => {
      lastControllerProps.handleChangeInput({ target: { name: 'password', value: 'secret' } })
    })
    expect(lastControllerProps.credentials.password).toBe('secret')
  })

  it('verifies password via API', async () => {
    renderController(CheckPassword, {})
    act(() => {
      lastControllerProps.handleChangeInput({ target: { name: 'password', value: 'secret' } })
    })
    await act(async () => {
      await lastControllerProps.getCheckPassword()
    })
    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.test/users/check_password',
      expect.objectContaining({ method: 'POST' })
    )
    expect(lastControllerProps.checkPasswordStatus.result).toEqual({ valid: true })
  })

  it('generates OTP code by email', async () => {
    renderController(CheckPassword, {})
    act(() => {
      lastControllerProps.setOtpType('email')
    })
    await act(async () => {
      await lastControllerProps.generateOtpCode({ email: 'admin@test.com' })
    })
    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.test/codes/generate',
      expect.objectContaining({ method: 'POST' })
    )
  })

  it('generates OTP by cellphone', async () => {
    renderController(CheckPassword, {})
    act(() => {
      lastControllerProps.setOtpType('cellphone')
    })
    await act(async () => {
      await lastControllerProps.generateOtpCode({ cellphone: '5551234' })
    })
    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.test/codes/generate',
      expect.objectContaining({ method: 'POST' })
    )
  })
})
