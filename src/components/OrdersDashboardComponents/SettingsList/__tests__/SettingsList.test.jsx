import { describe, it, expect, vi, beforeEach } from 'vitest'
import { waitFor, act } from '@testing-library/react'
import { renderController, lastControllerProps } from '../../../../__tests__/helpers/renderController'

const d2 = vi.hoisted(() => {
  const { createDashboardUsersTestContext } = require('../../../../__tests__/helpers/dashboardUsersTestHelpers')
  return createDashboardUsersTestContext(vi)
})

vi.mock('../../../../contexts/SessionContext', () => ({
  useSession: () => [d2.mockSessionState, { changeUser: vi.fn() }]
}))

vi.mock('../../../../contexts/ConfigContext', () => ({
  useConfig: () => [d2.mockConfigState, { refreshConfigs: d2.mockRefreshConfigs }]
}))

vi.mock('../../../../contexts/LanguageContext', () => ({
  useLanguage: () => [{ loading: false, language: { code: 'en' } }, d2.mockT]
}))

vi.mock('../../../../contexts/ToastContext', () => ({
  useToast: () => [[], { showToast: d2.mockShowToast }],
  ToastType: { error: 'error', success: 'success', info: 'info', Info: 'INFO', Success: 'SUCCESS', Error: 'ERROR' }
}))

vi.mock('../../../../contexts/ApiContext', () => ({
  useApi: () => [d2.mockOrdering]
}))

import { SettingsList } from '../index'

describe('SettingsList', () => {
  const category = { id: 1, name: 'General', configs: d2.sampleConfigs }

  beforeEach(() => d2.reset())

  it('loads configs from category', () => {
    renderController(SettingsList, { category })
    expect(lastControllerProps.configs).toHaveLength(2)
  })

  it('queues config changes', () => {
    renderController(SettingsList, { category })
    act(() => {
      lastControllerProps.handleInputChange('New Site', 1)
    })
    expect(lastControllerProps.configs.find(c => c.id === 1).value).toBe('New Site')
    expect(lastControllerProps.formState.changes).toHaveLength(1)
  })

  it('saves queued changes through API', async () => {
    renderController(SettingsList, { category })
    act(() => {
      lastControllerProps.handleInputChange('New Site', 1)
    })
    act(() => {
      lastControllerProps.handleClickUpdate()
    })
    await waitFor(() => {
      expect(d2.mockConfigSave).toHaveBeenCalled()
    })
  })

  it('handles checkbox config changes', () => {
    const checkboxConfigs = [
      { id: 3, key: 'driver_tip_options', value: '5|10', type: 3 }
    ]
    renderController(SettingsList, { category: { id: 1, name: 'Tips', configs: checkboxConfigs } })
    act(() => {
      lastControllerProps.handleCheckBoxChange(
        { target: { name: '15', checked: true, getAttribute: () => '3' } },
        true,
        '5|10'
      )
    })
    expect(lastControllerProps.formState.changes).toHaveLength(1)
  })
})
