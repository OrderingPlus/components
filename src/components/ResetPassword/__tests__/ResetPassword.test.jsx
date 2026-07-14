import { describe, it, expect, vi, beforeEach } from 'vitest'
import { waitFor } from '@testing-library/react'
import { renderController, lastControllerProps } from '../../../__tests__/helpers/renderController'

const auth = vi.hoisted(() => {
  const mockResetPassword = vi.fn()
  const mockOrdering = {
    users: vi.fn(() => ({ resetPassword: mockResetPassword }))
  }
  const reset = () => {
    vi.clearAllMocks()
    mockResetPassword.mockResolvedValue({ response: { data: { error: false, result: {} } } })
  }
  return { mockResetPassword, mockOrdering, reset }
})

vi.mock('../../../contexts/ApiContext', () => ({
  useApi: () => [auth.mockOrdering]
}))

import { ResetPassword } from '../index'

describe('ResetPassword', () => {
  beforeEach(() => auth.reset())

  it('exposes reset password data and handlers', () => {
    renderController(ResetPassword, { code: 'abc', random: 'xyz' })
    expect(lastControllerProps.resetPasswordData.code).toBe('abc')
    expect(lastControllerProps.resetPasswordData.random).toBe('xyz')
    expect(typeof lastControllerProps.handleResetPassword).toBe('function')
  })

  it('delegates to handleCustomResetPassword', async () => {
    const handleCustomResetPassword = vi.fn()
    renderController(ResetPassword, { code: '1', random: '2', handleCustomResetPassword })
    await lastControllerProps.handleResetPassword()
    expect(handleCustomResetPassword).toHaveBeenCalled()
  })

  it('calls resetPassword API on default path', async () => {
    const handleSuccessResetPassword = vi.fn()
    renderController(ResetPassword, { code: 'abc', random: 'xyz', handleSuccessResetPassword })
    await lastControllerProps.handleResetPassword()
    expect(auth.mockResetPassword).toHaveBeenCalled()
    expect(handleSuccessResetPassword).toHaveBeenCalled()
  })

  it('updates password through handleChangeInput', async () => {
    renderController(ResetPassword, { code: 'abc', random: 'xyz' })
    lastControllerProps.handleChangeInput({ target: { name: 'password', value: 'new-pass' } })
    await waitFor(() => {
      expect(lastControllerProps.resetPasswordData.password).toBe('new-pass')
    })
  })
})
