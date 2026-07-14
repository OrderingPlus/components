import { describe, it, expect, vi, beforeEach } from 'vitest'
import { waitFor } from '@testing-library/react'
import { renderController, lastControllerProps } from '../../../../__tests__/helpers/renderController'

const d4 = vi.hoisted(() => {
  const { createDashboardLogisticsTestContext } = require('../../../../__tests__/helpers/dashboardLogisticsTestHelpers')
  return createDashboardLogisticsTestContext(vi)
})

vi.mock('../../../../contexts/LanguageContext', () => ({
  useLanguage: () => [{ loading: false, language: { code: 'en' } }, d4.mockT]
}))

vi.mock('../../../../contexts/UtilsContext', () => ({
  useUtils: () => [{ getOrderState: d4.mockGetOrderState, parseDistance: d4.mockParseDistance }]
}))

vi.mock('../../../../contexts/SessionContext', () => ({
  useSession: () => [d4.mockSessionState, { changeUser: vi.fn() }]
}))

vi.mock('../../../../contexts/ApiContext', () => ({
  useApi: () => [d4.mockOrdering]
}))

import { Logistics } from '../index'

describe('Logistics', () => {
  beforeEach(() => d4.reset())

  it('loads order logistics logs', async () => {
    renderController(Logistics, { orderId: 101 })
    await waitFor(() => {
      expect(lastControllerProps.logisticList.loading).toBe(false)
    })
    expect(lastControllerProps.logisticList.logs).toHaveLength(1)
  })

  it('parses driver logistic events', () => {
    renderController(Logistics, { orderId: 101 })
    const message = lastControllerProps.parseLog({
      event: 'logistic_driver_found',
      driver_id: 4,
      driver: { name: 'John', lastname: 'Doe' },
      data: { distance: 2.5, status: 4 }
    })
    expect(message).toContain('LOG_LOGISTIC_DRIVER_FOUND')
    expect(d4.mockParseDistance).toHaveBeenCalledWith(2.5)
    expect(d4.mockGetOrderState).toHaveBeenCalledWith(4)
  })

  it('parses general logistic events', () => {
    renderController(Logistics, { orderId: 101 })
    const message = lastControllerProps.parseLog({
      event: 'logistic_started',
      data: { with_orders: [101, 102] }
    })
    expect(message).toContain('LOG_LOGISTIC_STARTED')
  })

  it('parses driver company logistic events', () => {
    renderController(Logistics, { orderId: 101 })
    const message = lastControllerProps.parseLog({
      event: 'logistic_manual_driver_assignment',
      driver_company_id: 3,
      driver_company: { name: 'Fleet Co' },
      data: {}
    })
    expect(message).toContain('LOG_LOGISTIC_MANUAL_DRIVER_ASSIGNMENT')
  })

  it('falls back to raw event for unknown logs', () => {
    renderController(Logistics, { orderId: 101 })
    const message = lastControllerProps.parseLog({
      event: 'custom_log_event',
      data: { note: 'test' }
    })
    expect(message).toContain('CUSTOM_LOG_EVENT')
    expect(message).toContain('note')
  })
})
