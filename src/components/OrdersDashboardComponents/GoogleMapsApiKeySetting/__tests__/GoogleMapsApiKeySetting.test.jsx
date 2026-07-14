import { describe, it, expect, vi, beforeEach } from 'vitest'
import { act } from '@testing-library/react'
import { renderController, lastControllerProps } from '../../../../__tests__/helpers/renderController'

const d4 = vi.hoisted(() => {
  const { createDashboardLogisticsTestContext } = require('../../../../__tests__/helpers/dashboardLogisticsTestHelpers')
  return createDashboardLogisticsTestContext(vi)
})

vi.mock('../../../../contexts/ToastContext', () => ({
  useToast: () => [[], { showToast: d4.mockShowToast }],
  ToastType: { error: 'error', success: 'success', info: 'info', Info: 'INFO', Success: 'SUCCESS', Error: 'ERROR' }
}))

vi.mock('../../../../contexts/ConfigContext', () => ({
  useConfig: () => [d4.mockConfigState, { refreshConfigs: d4.mockRefreshConfigs }]
}))

vi.mock('../../../../contexts/SessionContext', () => ({
  useSession: () => [d4.mockSessionState, { changeUser: vi.fn() }]
}))

vi.mock('../../../../contexts/ApiContext', () => ({
  useApi: () => [d4.mockOrdering]
}))

import { GoogleMapsApiKeySetting } from '../index'

describe('GoogleMapsApiKeySetting', () => {
  beforeEach(() => d4.reset())

  it('saves google maps api key', async () => {
    renderController(GoogleMapsApiKeySetting, {})
    await act(async () => {
      await lastControllerProps.handleSaveApiKey('new-maps-key')
    })
    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.test/configs/12',
      expect.objectContaining({ method: 'PUT' })
    )
    expect(d4.mockRefreshConfigs).toHaveBeenCalled()
    expect(d4.mockShowToast).toHaveBeenCalled()
  })
})
