import { describe, it, expect, vi, beforeEach } from 'vitest'
import { waitFor, act } from '@testing-library/react'
import { renderController, lastControllerProps } from '../../../../__tests__/helpers/renderController'

const d1 = vi.hoisted(() => {
  const { createDashboardOrdersTestContext } = require('../../../../__tests__/helpers/dashboardOrdersTestHelpers')
  return createDashboardOrdersTestContext(vi)
})

vi.mock('../../../../contexts/ToastContext', () => ({
  useToast: () => [[], { showToast: d1.mockShowToast }],
  ToastType: { error: 'error', success: 'success', info: 'info' }
}))

vi.mock('../../../../contexts/SessionContext', () => ({
  useSession: () => [d1.mockSessionState, { changeUser: vi.fn() }]
}))

vi.mock('../../../../contexts/ApiContext', () => ({
  useApi: () => [d1.mockOrdering]
}))

import { DashboardBusinessList } from '../index'

describe('DashboardBusinessList', () => {
  beforeEach(() => d1.reset())

  it('uses businesses prop for initial list', () => {
    renderController(DashboardBusinessList, { businesses: [d1.sampleBusiness] })
    expect(lastControllerProps.businessList.businesses).toEqual([d1.sampleBusiness])
    expect(lastControllerProps.businessList.loading).toBe(false)
  })

  it('toggles selected business ids', () => {
    renderController(DashboardBusinessList, { businesses: [d1.sampleBusiness] })
    act(() => {
      lastControllerProps.handleChangeBusinessIds(1)
    })
    expect(lastControllerProps.businessIds).toEqual([1])
    act(() => {
      lastControllerProps.handleChangeBusinessIds(1)
    })
    expect(lastControllerProps.businessIds).toEqual([])
  })

  it('removes business from list on success callback', () => {
    renderController(DashboardBusinessList, {
      businesses: [d1.sampleBusiness, { id: 2, name: 'B', enabled: true }]
    })
    act(() => {
      lastControllerProps.handleSucessRemoveBusiness(1)
    })
    expect(lastControllerProps.businessList.businesses).toHaveLength(1)
    expect(lastControllerProps.businessList.businesses[0].id).toBe(2)
  })

  it('bulk-enables selected businesses', async () => {
    renderController(DashboardBusinessList, { businesses: [d1.sampleBusiness] })
    act(() => {
      lastControllerProps.setBusinessIds([1])
    })
    await act(async () => {
      await lastControllerProps.handleEnableAllBusiness(true)
    })
    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.test/business',
      expect.objectContaining({ method: 'PUT' })
    )
    expect(d1.mockShowToast).toHaveBeenCalled()
  })

  it('loads businesses from API when prop is not provided', async () => {
    renderController(DashboardBusinessList, {})
    await waitFor(() => {
      expect(lastControllerProps.businessList.loading).toBe(false)
    })
    expect(lastControllerProps.businessList.businesses).toHaveLength(1)
  })

  it('updates business in list after success callback', () => {
    renderController(DashboardBusinessList, { businesses: [d1.sampleBusiness] })
    act(() => {
      lastControllerProps.handleSucessUpdateBusiness({ ...d1.sampleBusiness, name: 'Updated Store' })
    })
    expect(lastControllerProps.businessList.businesses[0].name).toBe('Updated Store')
  })

  it('deletes selected businesses in bulk', async () => {
    renderController(DashboardBusinessList, {
      businesses: [d1.sampleBusiness, { id: 2, name: 'B', enabled: true }]
    })
    act(() => {
      lastControllerProps.setBusinessIds([1, 2])
    })
    await act(async () => {
      await lastControllerProps.handleDeleteMultiBusinesses()
    })
    expect(lastControllerProps.businessList.businesses).toHaveLength(0)
  })
})
