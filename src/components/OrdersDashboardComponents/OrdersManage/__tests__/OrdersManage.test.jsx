import { describe, it, expect, vi, beforeEach } from 'vitest'
import { waitFor, act } from '@testing-library/react'
import { renderController, lastControllerProps } from '../../../../__tests__/helpers/renderController'

const d1 = vi.hoisted(() => {
  const { createDashboardOrdersTestContext } = require('../../../../__tests__/helpers/dashboardOrdersTestHelpers')
  return createDashboardOrdersTestContext(vi)
})

vi.mock('../../../../contexts/ToastContext', () => ({
  useToast: () => [[], { showToast: d1.mockShowToast }],
  ToastType: { error: 'error', success: 'success', info: 'info', Info: 'INFO', Success: 'SUCCESS', Error: 'ERROR' }
}))

vi.mock('../../../../contexts/ApiContext', () => ({
  useApi: () => [d1.mockOrdering]
}))

vi.mock('../../../../contexts/WebsocketContext', () => ({
  useWebsocket: () => d1.mockSocket
}))

vi.mock('../../../../contexts/SessionContext', () => ({
  useSession: () => [d1.mockSessionState, { changeUser: vi.fn() }]
}))

vi.mock('../../../../contexts/ConfigContext', () => ({
  useConfig: () => [d1.mockConfigState]
}))

vi.mock('../../../../contexts/LanguageContext', () => ({
  useLanguage: () => [{ loading: false, language: { code: 'en' } }, d1.mockT]
}))

import { OrdersManage } from '../index'

describe('OrdersManage', () => {
  beforeEach(() => d1.reset())

  it('loads controls and driver data on mount', async () => {
    renderController(OrdersManage, {})
    await waitFor(() => {
      expect(lastControllerProps.driversList.loading).toBe(false)
    })
    expect(lastControllerProps.businessesList.businesses).toHaveLength(1)
    expect(lastControllerProps.numberOfOrdersByStatus.result).toBeTruthy()
  })

  it('toggles selected order ids and status group', () => {
    renderController(OrdersManage, {})
    act(() => {
      lastControllerProps.handleSelectedOrderIds(101)
    })
    expect(lastControllerProps.selectedOrderIds).toEqual([101])
    act(() => {
      lastControllerProps.handleOrdersStatusGroupFilter('inProgress')
    })
    expect(lastControllerProps.ordersStatusGroup).toBe('inProgress')
    expect(lastControllerProps.selectedOrderIds).toEqual([])
  })

  it('updates search value', () => {
    renderController(OrdersManage, {})
    act(() => {
      lastControllerProps.handleChangeSearch('test@email.com')
    })
    expect(lastControllerProps.searchValue).toBe('test@email.com')
  })

  it('deletes selected orders', async () => {
    renderController(OrdersManage, {})
    act(() => {
      lastControllerProps.setSelectedOrderIds([101, 102])
    })
    await act(async () => {
      await lastControllerProps.handleDeleteMultiOrders()
    })
    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.test/orders',
      expect.objectContaining({ method: 'DELETE' })
    )
    expect(lastControllerProps.deletedOrderIds).toEqual([101, 102])
  })

  it('increments pending count on websocket new order', async () => {
    renderController(OrdersManage, {})
    await waitFor(() => expect(lastControllerProps.numberOfOrdersByStatus.result).toBeTruthy())
    const registerHandler = d1.mockSocket.on.mock.calls.find(([e]) => e === 'orders_register')?.[1]
    act(() => {
      registerHandler({ id: 200, status: 0, customer_id: 8, products: [{ type: 'item' }] })
    })
    expect(lastControllerProps.numberOfOrdersByStatus.result.pending).toBeGreaterThan(0)
  })

  it('updates order status counts on websocket status change', async () => {
    renderController(OrdersManage, {})
    await waitFor(() => expect(lastControllerProps.numberOfOrdersByStatus.result).toBeTruthy())
    const pendingBefore = lastControllerProps.numberOfOrdersByStatus.result.pending
    const updateHandler = d1.mockSocket.on.mock.calls.find(([e]) => e === 'update_order')?.[1]
    act(() => {
      updateHandler({
        id: 201,
        customer_id: 8,
        history: [{ data: [{ attribute: 'status', old: 0, new: 7 }] }]
      })
    })
    expect(lastControllerProps.numberOfOrdersByStatus.result.pending).toBeLessThanOrEqual(pendingBefore)
  })

  it('applies advanced filter values', () => {
    renderController(OrdersManage, {})
    act(() => {
      lastControllerProps.handleChangeFilterValues({
        statuses: [0],
        orderId: '101',
        externalId: null,
        businessIds: [1],
        driverIds: [],
        driverGroupIds: [],
        cityIds: [],
        deliveryTypes: [],
        paymethodIds: [],
        countryCode: [],
        currency: [],
        metafield: [],
        deliveryFromDatetime: null,
        deliveryEndDatetime: null
      })
    })
    expect(lastControllerProps.filterValues.orderId).toBe('101')
  })
})
