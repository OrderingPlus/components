import { describe, it, expect, vi, beforeEach } from 'vitest'
import { act } from '@testing-library/react'
import { renderController, lastControllerProps } from '../../../../__tests__/helpers/renderController'

const d3 = vi.hoisted(() => {
  const { createDashboardBusinessTestContext } = require('../../../../__tests__/helpers/dashboardBusinessTestHelpers')
  return createDashboardBusinessTestContext(vi)
})

vi.mock('../../../../contexts/SessionContext', () => ({
  useSession: () => [d3.mockSessionState, { changeUser: vi.fn() }]
}))

vi.mock('../../../../contexts/ApiContext', () => ({
  useApi: () => [d3.mockOrdering]
}))

import { ExportCSV } from '../index'

describe('ExportCSV', () => {
  beforeEach(() => d3.reset())

  it('exports all orders without filters', async () => {
    renderController(ExportCSV, {})
    await act(async () => {
      await lastControllerProps.getCSV(false)
    })
    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.test/orders.csv?mode=dashboard&orderBy=id',
      expect.objectContaining({ method: 'GET' })
    )
    expect(lastControllerProps.actionStatus.result).toEqual({ url: 'https://cdn.test/orders.csv' })
  })

  it('exports filtered orders with franchise id', async () => {
    renderController(ExportCSV, {
      franchiseId: 9,
      filterValues: d3.fullFilterValues
    })
    await act(async () => {
      await lastControllerProps.getCSV(true)
    })
    const csvCall = global.fetch.mock.calls.find(([url]) => url.includes('/orders.csv?'))
    expect(csvCall?.[0]).toContain('where=')
    expect(csvCall?.[0]).toContain('ref_business')
  })
})
