import { describe, it, expect, vi, beforeEach } from 'vitest'
import { act } from '@testing-library/react'
import { renderController, lastControllerProps } from '../../../../__tests__/helpers/renderController'

const d2 = vi.hoisted(() => {
  const { createDashboardUsersTestContext } = require('../../../../__tests__/helpers/dashboardUsersTestHelpers')
  return createDashboardUsersTestContext(vi)
})

vi.mock('../../../../contexts/LanguageContext', () => ({
  useLanguage: () => [{ loading: false, language: { code: 'en' } }, d2.mockT]
}))

vi.mock('../../../../contexts/ToastContext', () => ({
  useToast: () => [[], { showToast: d2.mockShowToast }],
  ToastType: { error: 'error', success: 'success', info: 'info' }
}))

vi.mock('../../../../contexts/SessionContext', () => ({
  useSession: () => [d2.mockSessionState, { changeUser: vi.fn() }]
}))

vi.mock('../../../../contexts/ValidationsFieldsContext', () => ({
  useValidationFields: () => [{
    loading: false,
    fields: { checkout: { name: { enabled: true, required: true } } }
  }]
}))

vi.mock('../../../../contexts/ApiContext', () => ({
  useApi: () => [d2.mockOrdering]
}))

import { UserFormDetails } from '../index'

describe('UserFormDetails', () => {
  beforeEach(() => d2.reset())

  it('uses user prop without fetch', () => {
    renderController(UserFormDetails, { user: d2.sampleUser })
    expect(lastControllerProps.userState.result.result).toEqual(d2.sampleUser)
  })

  it('updates form through handleChangeInput', () => {
    renderController(UserFormDetails, { user: d2.sampleUser })
    act(() => {
      lastControllerProps.handleChangeInput({ target: { name: 'name', value: 'New' } })
    })
    expect(lastControllerProps.formState.changes.name).toBe('New')
  })

  it('evaluates validation field helpers', () => {
    renderController(UserFormDetails, { user: d2.sampleUser, useValidationFields: true })
    expect(lastControllerProps.showField('name')).toBe(true)
    expect(lastControllerProps.isRequiredField('name')).toBe(true)
  })

  it('creates a new user', async () => {
    renderController(UserFormDetails, { user: null })
    act(() => {
      lastControllerProps.handleChangeInput({ target: { name: 'name', value: 'New User' } })
    })
    await act(async () => {
      await lastControllerProps.handleButtonAddClick()
    })
    expect(d2.mockUserSave).toHaveBeenCalled()
  })

  it('toggles driver group selection', () => {
    renderController(UserFormDetails, { user: d2.sampleUser })
    act(() => {
      lastControllerProps.handleDriverGroupClick(3)
    })
    expect(lastControllerProps.selectedDriverGroupIds).toEqual([3])
    expect(lastControllerProps.formState.changes.driver_groups_ids).toEqual([3])
  })

  it('updates existing user', async () => {
    renderController(UserFormDetails, { user: d2.sampleUser })
    act(() => {
      lastControllerProps.handleChangeInput({ target: { name: 'name', value: 'Edited' } })
    })
    await act(async () => {
      await lastControllerProps.handleButtonUpdateClick()
    })
    expect(d2.mockUserSave).toHaveBeenCalled()
  })

  it('toggles switch and user type fields', () => {
    renderController(UserFormDetails, { user: d2.sampleUser })
    act(() => {
      lastControllerProps.handleChangeSwtich('enabled', false)
    })
    expect(lastControllerProps.formState.changes.enabled).toBe(false)
    act(() => {
      lastControllerProps.handleChangeUserType(4)
    })
    expect(lastControllerProps.formState.changes.level).toBe(4)
  })
})
