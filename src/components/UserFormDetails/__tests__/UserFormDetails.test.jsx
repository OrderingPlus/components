import { describe, it, expect, vi, beforeEach } from 'vitest'
import { waitFor, act } from '@testing-library/react'
import { renderController, lastControllerProps } from '../../../__tests__/helpers/renderController'

const upm = vi.hoisted(() => {
  const { createUserProjectMiscTestContext } = require('../../../__tests__/helpers/userProjectMiscTestHelpers')
  return createUserProjectMiscTestContext(vi)
})

vi.mock('../../../contexts/LanguageContext', () => ({
  useLanguage: () => [{ loading: false, language: { code: 'en' } }, upm.mockT]
}))

vi.mock('../../../contexts/ToastContext', () => ({
  useToast: () => [[], { showToast: upm.mockShowToast }],
  ToastType: { error: 'error', success: 'success', info: 'info' }
}))

vi.mock('../../../contexts/SessionContext', () => ({
  useSession: () => [{
    auth: true,
    loading: false,
    user: upm.sampleUser,
    token: 'session-tok'
  }, { changeUser: upm.mockChangeUser }]
}))

vi.mock('../../../contexts/CustomerContext', () => ({
  useCustomer: () => [{ user: upm.sampleUser }, { setUserCustomer: upm.mockSetUserCustomer }]
}))

vi.mock('../../../contexts/ValidationsFieldsContext', () => ({
  useValidationFields: () => [{
    loading: false,
    fields: {
      checkout: {
        name: { enabled: true, required: true },
        email: { enabled: true, required: false }
      }
    }
  }]
}))

vi.mock('../../../contexts/ApiContext', () => ({
  useApi: () => [upm.mockOrdering, { setOrdering: upm.mockSetOrdering }]
}))

import { UserFormDetails } from '../index'

describe('UserFormDetails', () => {
  beforeEach(() => upm.reset())

  it('uses user prop without API fetch', () => {
    renderController(UserFormDetails, { user: upm.sampleUser })
    expect(lastControllerProps.userState.result.result).toEqual(upm.sampleUser)
    expect(lastControllerProps.userState.loading).toBe(false)
  })

  it('updates form changes through handleChangeInput', () => {
    renderController(UserFormDetails, { user: upm.sampleUser })
    act(() => {
      lastControllerProps.handleChangeInput({ target: { name: 'name', value: 'New Name' } })
    })
    expect(lastControllerProps.formState.changes.name).toBe('New Name')
  })

  it('evaluates showField and isRequiredField helpers', () => {
    renderController(UserFormDetails, { user: upm.sampleUser, useValidationFields: true })
    expect(lastControllerProps.showField('name')).toBe(true)
    expect(lastControllerProps.isRequiredField('name')).toBe(true)
    expect(lastControllerProps.isRequiredField('email')).toBe(false)
  })

  it('saves profile updates through API', async () => {
    renderController(UserFormDetails, {
      user: upm.sampleUser,
      onClose: upm.mockOnClose,
      handleSuccessUpdate: upm.mockHandleSuccessUpdate
    })
    act(() => {
      lastControllerProps.handleChangeInput({ target: { name: 'name', value: 'Updated' } })
    })
    await act(async () => {
      await lastControllerProps.handleButtonUpdateClick()
    })
    expect(upm.mockUserSave).toHaveBeenCalled()
    expect(upm.mockChangeUser).toHaveBeenCalled()
    expect(upm.mockOnClose).toHaveBeenCalled()
    expect(upm.mockHandleSuccessUpdate).toHaveBeenCalled()
  })

  it('sends phone verification code', async () => {
    renderController(UserFormDetails, { user: upm.sampleUser })
    await act(async () => {
      await lastControllerProps.handleSendVerifyCode({
        cellphone: '5551234567',
        country_phone_code: '1'
      })
    })
    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.test/auth/sms/twilio/verify',
      expect.objectContaining({ method: 'POST' })
    )
  })

  it('removes user account', async () => {
    renderController(UserFormDetails, { user: upm.sampleUser })
    await act(async () => {
      await lastControllerProps.handleRemoveAccount(8)
    })
    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.test/users/8',
      expect.objectContaining({ method: 'DELETE' })
    )
  })

  it('loads wallets when wallet flags are enabled', async () => {
    renderController(UserFormDetails, {
      user: upm.sampleUser,
      isWalletCashEnabled: true,
      isWalletPointsEnabled: true
    })
    await waitFor(() => {
      expect(lastControllerProps.wallets.loading).toBe(false)
    })
    expect(lastControllerProps.wallets.result.result.cash).toBeTruthy()
    expect(lastControllerProps.wallets.result.result.points).toBeTruthy()
  })
})
