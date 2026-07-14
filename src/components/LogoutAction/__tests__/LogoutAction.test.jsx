import { describe, it, expect, vi } from 'vitest'
import { renderController, lastControllerProps } from '../../../__tests__/helpers/renderController'

const mockLogout = vi.fn()
const mockSetStateInitialValues = vi.fn()

vi.mock('../../../contexts/SessionContext', () => ({
  useSession: () => [{ user: { id: 1, level: 0 }, token: 'tok', auth: true }, { logout: mockLogout }]
}))

vi.mock('../../../contexts/OrderContext', () => ({
  useOrder: () => [{ options: { type: 1 } }, { setStateInitialValues: mockSetStateInitialValues }]
}))

vi.mock('../../../contexts/ConfigContext', () => ({
  useConfig: () => [{ configs: {} }]
}))

vi.mock('../../../contexts/LanguageContext', () => ({
  useLanguage: () => [{}, (key, fallback) => fallback || key]
}))

const mockOrdering = {
  setAccessToken: vi.fn(function () { return mockOrdering }),
  users: vi.fn(() => ({
    logout: vi.fn().mockResolvedValue({ content: { error: false, result: {} } })
  }))
}

vi.mock('../../../contexts/ApiContext', () => ({
  useApi: () => [mockOrdering]
}))

import { LogoutAction } from '../index'

describe('LogoutAction', () => {
  it('exposes handleLogoutClick', () => {
    renderController(LogoutAction, { handleSuccessLogout: vi.fn() })
    expect(typeof lastControllerProps.handleLogoutClick).toBe('function')
    expect(lastControllerProps.formState.loading).toBe(false)
  })

  it('logs out via API and clears session', async () => {
    const handleSuccessLogout = vi.fn()
    renderController(LogoutAction, { handleSuccessLogout })
    const ok = await lastControllerProps.handleLogoutClick()
    expect(ok).toBe(true)
    expect(mockLogout).toHaveBeenCalled()
    expect(mockSetStateInitialValues).toHaveBeenCalled()
    expect(handleSuccessLogout).toHaveBeenCalled()
  })

  it('sends notification token on logout when provided', async () => {
    renderController(LogoutAction, {})
    await lastControllerProps.handleLogoutClick({
      notification_app: 'orderingapp',
      notification_token: 'push-token'
    })
    expect(mockOrdering.users).toHaveBeenCalled()
  })
})
