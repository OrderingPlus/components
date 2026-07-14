import { describe, it, expect, vi, beforeEach } from 'vitest'
import { waitFor, act } from '@testing-library/react'
import { renderController, lastControllerProps } from '../../../../__tests__/helpers/renderController'

const d4 = vi.hoisted(() => {
  const { createDashboardLogisticsTestContext } = require('../../../../__tests__/helpers/dashboardLogisticsTestHelpers')
  return createDashboardLogisticsTestContext(vi)
})

vi.mock('../../../../contexts/SessionContext', () => ({
  useSession: () => [d4.mockSessionState, { changeUser: vi.fn() }]
}))

vi.mock('../../../../contexts/ApiContext', () => ({
  useApi: () => [d4.mockOrdering]
}))

import { Appointments } from '../index'

describe('Appointments', () => {
  beforeEach(() => d4.reset())

  it('loads calendar events when business is selected', async () => {
    renderController(Appointments, {})
    act(() => {
      lastControllerProps.setSelectedBusiness(d4.sampleBusiness)
    })
    await waitFor(() => {
      expect(lastControllerProps.businessCalendarEvents.loading).toBe(false)
    })
    expect(lastControllerProps.businessCalendarEvents.result).toHaveLength(1)
  })

  it('skips fetch when no business is selected', () => {
    renderController(Appointments, {})
    const calendarCalls = global.fetch.mock.calls.filter(([url]) => url.includes('/calendar_events'))
    expect(calendarCalls).toHaveLength(0)
  })
})
