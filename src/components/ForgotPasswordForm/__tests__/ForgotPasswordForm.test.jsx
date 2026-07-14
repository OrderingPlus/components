import { describe, it, expect, vi, beforeEach } from 'vitest'
import { waitFor } from '@testing-library/react'
import { renderController, lastControllerProps } from '../../../__tests__/helpers/renderController'

const auth = vi.hoisted(() => {
  const mockT = (key, fallback) => fallback || key
  const mockForgotPassword = vi.fn()
  const mockOrdering = {
    users: vi.fn(() => ({ forgotPassword: mockForgotPassword }))
  }
  const reset = () => {
    vi.clearAllMocks()
    mockForgotPassword.mockResolvedValue({ content: { error: false, result: {} } })
  }
  return { mockT, mockForgotPassword, mockOrdering, reset }
})

vi.mock('../../../contexts/LanguageContext', () => ({
  useLanguage: () => [{ language: { code: 'en' } }, auth.mockT, vi.fn()]
}))

vi.mock('../../../contexts/ApiContext', () => ({
  useApi: () => [auth.mockOrdering]
}))

vi.mock('../../../contexts/ConfigContext', () => ({
  useConfig: () => [{ configs: {} }]
}))

import { ForgotPasswordForm } from '../index'

describe('ForgotPasswordForm', () => {
  beforeEach(() => auth.reset())

  it('exposes forgot password form data and handler', () => {
    renderController(ForgotPasswordForm, { defaultEmail: 'user@test.com' })
    expect(lastControllerProps.formData.email).toBe('user@test.com')
    expect(typeof lastControllerProps.handleButtonForgotPasswordClick).toBe('function')
  })

  it('uses custom handler when provided', async () => {
    const handleCustomForgotPasswordClick = vi.fn()
    renderController(ForgotPasswordForm, { handleCustomForgotPasswordClick })
    await lastControllerProps.handleButtonForgotPasswordClick({ email: 'x@test.com' })
    expect(handleCustomForgotPasswordClick).toHaveBeenCalledWith({ email: 'x@test.com' })
  })

  it('calls forgotPassword API on default path', async () => {
    const handleSuccessForgotPassword = vi.fn()
    renderController(ForgotPasswordForm, { defaultEmail: 'user@test.com', handleSuccessForgotPassword })
    await lastControllerProps.handleButtonForgotPasswordClick({ email: 'user@test.com' })
    expect(auth.mockForgotPassword).toHaveBeenCalledWith({ email: 'user@test.com' })
    expect(handleSuccessForgotPassword).toHaveBeenCalledWith('user@test.com')
  })

  it('updates email through hanldeChangeInput', async () => {
    renderController(ForgotPasswordForm, {})
    lastControllerProps.hanldeChangeInput({ target: { name: 'email', value: 'changed@test.com' } })
    await waitFor(() => {
      expect(lastControllerProps.formData.email).toBe('changed@test.com')
    })
  })
})
