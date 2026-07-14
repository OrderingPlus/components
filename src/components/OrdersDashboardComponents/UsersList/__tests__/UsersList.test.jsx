import { describe, it, expect, vi, beforeEach } from 'vitest'
import { waitFor, act } from '@testing-library/react'
import { renderController, lastControllerProps } from '../../../../__tests__/helpers/renderController'

const d2 = vi.hoisted(() => {
  const { createDashboardUsersTestContext } = require('../../../../__tests__/helpers/dashboardUsersTestHelpers')
  return createDashboardUsersTestContext(vi)
})

vi.mock('../../../../contexts/EventContext', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    useEvent: () => [{ emit: d2.mockEmit, on: d2.mockEventsOn, off: d2.mockEventsOff }]
  }
})

vi.mock('../../../../contexts/LanguageContext', () => ({
  useLanguage: () => [{ loading: false, language: { code: 'en' } }, d2.mockT]
}))

vi.mock('../../../../contexts/ToastContext', () => ({
  useToast: () => [[], { showToast: d2.mockShowToast }],
  ToastType: { error: 'error', success: 'success', info: 'info', Info: 'INFO', Success: 'SUCCESS', Error: 'ERROR' }
}))

vi.mock('../../../../contexts/SessionContext', () => ({
  useSession: () => [d2.mockSessionState, { changeUser: vi.fn() }]
}))

vi.mock('../../../../contexts/ApiContext', () => ({
  useApi: () => [d2.mockOrdering]
}))

import { UsersList } from '../index'

describe('UsersList', () => {
  beforeEach(() => d2.reset())

  it('loads users on mount', async () => {
    renderController(UsersList, {})
    await waitFor(() => {
      expect(lastControllerProps.usersList.loading).toBe(false)
    })
    expect(lastControllerProps.usersList.users).toHaveLength(1)
  })

  it('toggles selected users', () => {
    renderController(UsersList, {})
    act(() => {
      lastControllerProps.handleSelectedUsers(8)
    })
    expect(lastControllerProps.selectedUsers).toEqual([8])
    act(() => {
      lastControllerProps.handleSelectedUsers(8)
    })
    expect(lastControllerProps.selectedUsers).toEqual([])
  })

  it('toggles active user filter state', () => {
    renderController(UsersList, { defaultUserActiveState: true })
    act(() => {
      lastControllerProps.handleChangeUserActiveState()
    })
    expect(lastControllerProps.selectedUserActiveState).toBe(false)
  })

  it('updates user in list after success callback', async () => {
    renderController(UsersList, {})
    await waitFor(() => expect(lastControllerProps.usersList.users).toHaveLength(1))
    act(() => {
      lastControllerProps.handleSuccessUpdate({ ...d2.sampleUser, name: 'Updated Name' })
    })
    expect(lastControllerProps.usersList.users[0].name).toBe('Updated Name')
  })

  it('applies multi-filter values', async () => {
    renderController(UsersList, {})
    act(() => {
      lastControllerProps.handleChangeMultiFilterValues({ name: 'Jane' })
    })
    await waitFor(() => expect(d2.mockUsersGet).toHaveBeenCalled())
  })

  it('changes user type and active state', async () => {
    renderController(UsersList, { userTypesSelected: [3] })
    await waitFor(() => expect(lastControllerProps.usersList.users).toHaveLength(1))
    await act(async () => {
      await lastControllerProps.handleChangeUserType({ id: 8, level: 3 })
    })
    expect(d2.mockUserSave).toHaveBeenCalled()
    await act(async () => {
      await lastControllerProps.handleChangeActiveUser({ id: 8, enabled: false })
    })
    expect(d2.mockShowToast).toHaveBeenCalled()
  })

  it('deletes a user and loads occupations for professionals', async () => {
    renderController(UsersList, { isProfessional: true })
    await waitFor(() => expect(lastControllerProps.occupationsState.occupations).toHaveLength(1))
    await waitFor(() => expect(lastControllerProps.usersList.users).toHaveLength(1))
    await act(async () => {
      await lastControllerProps.handleDeleteUser(8)
    })
    expect(d2.mockUserDelete).toHaveBeenCalled()
    expect(lastControllerProps.usersList.users).toHaveLength(0)
  })

  it('refetches when user types filter changes', async () => {
    renderController(UsersList, {})
    await waitFor(() => expect(lastControllerProps.usersList.loading).toBe(false))
    const callsBefore = d2.mockUsersGet.mock.calls.length
    act(() => {
      lastControllerProps.handleSelectedUserTypes([3, 4])
    })
    await waitFor(() => expect(d2.mockUsersGet.mock.calls.length).toBeGreaterThan(callsBefore))
  })

  it('filters disabled users from active list', async () => {
    renderController(UsersList, { defaultUserActiveState: true })
    await waitFor(() => expect(lastControllerProps.usersList.users).toHaveLength(1))
    await act(async () => {
      await lastControllerProps.handleChangeActiveUser({ id: 8, enabled: false })
    })
    expect(lastControllerProps.usersList.users).toHaveLength(0)
  })

  it('adds user after success callback', async () => {
    renderController(UsersList, {})
    await waitFor(() => expect(lastControllerProps.usersList.users).toHaveLength(1))
    act(() => {
      lastControllerProps.handleSuccessAddUser({ id: 99, name: 'New', level: 3 })
    })
    expect(lastControllerProps.usersList.users.some(u => u.id === 99)).toBe(true)
  })

  it('bulk-deletes selected users', async () => {
    renderController(UsersList, {})
    await waitFor(() => expect(lastControllerProps.usersList.users).toHaveLength(1))
    act(() => {
      lastControllerProps.handleSelectedUsers(8)
    })
    await act(async () => {
      await lastControllerProps.handleDeleteSeveralUsers('1234')
    })
    expect(lastControllerProps.usersList.users).toHaveLength(0)
  })

  it('refetches when advanced filters change', async () => {
    renderController(UsersList, {})
    await waitFor(() => expect(lastControllerProps.usersList.loading).toBe(false))
    const callsBefore = d2.mockUsersGet.mock.calls.length
    act(() => {
      lastControllerProps.setFilterValues({ changes: { email: 'jane@test.com' }, clear: false })
    })
    await waitFor(() => expect(d2.mockUsersGet.mock.calls.length).toBeGreaterThan(callsBefore))
  })

  it('toggles verified filter', () => {
    renderController(UsersList, {})
    act(() => {
      lastControllerProps.setIsVerified(true)
    })
    expect(lastControllerProps.isVerified).toBe(true)
  })
})
