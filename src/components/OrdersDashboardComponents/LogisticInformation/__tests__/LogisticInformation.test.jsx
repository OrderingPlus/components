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

import { LogisticInformation } from '../index'

describe('LogisticInformation', () => {
  beforeEach(() => d4.reset())

  it('loads logistic information for order', async () => {
    renderController(LogisticInformation, { orderId: 101 })
    await waitFor(() => {
      expect(lastControllerProps.logisticInformation.loading).toBe(false)
    })
    expect(lastControllerProps.logisticInformation.data).toHaveLength(1)
  })

  it('refetches logistic information on demand', async () => {
    renderController(LogisticInformation, { orderId: 101 })
    await waitFor(() => expect(lastControllerProps.logisticInformation.data).toHaveLength(1))
    await act(async () => {
      await lastControllerProps.getLogistics()
    })
    const infoCalls = global.fetch.mock.calls.filter(([url]) => url.includes('/logistic/orders/101/information'))
    expect(infoCalls.length).toBeGreaterThan(1)
  })
})
