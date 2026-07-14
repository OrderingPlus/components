import { describe, it, expect, vi, beforeEach } from 'vitest'
import { waitFor, act } from '@testing-library/react'
import { renderController, lastControllerProps } from '../../../../__tests__/helpers/renderController'

const d1 = vi.hoisted(() => {
  const { createDashboardOrdersTestContext } = require('../../../../__tests__/helpers/dashboardOrdersTestHelpers')
  return createDashboardOrdersTestContext(vi)
})

vi.mock('../../../../contexts/EventContext', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    useEvent: () => [{ emit: d1.mockEmit, on: d1.mockEventsOn, off: d1.mockEventsOff }]
  }
})

vi.mock('../../../../contexts/SessionContext', () => ({
  useSession: () => [d1.mockSessionState, { changeUser: vi.fn() }]
}))

vi.mock('../../../../contexts/ApiContext', () => ({
  useApi: () => [d1.mockOrdering]
}))

vi.mock('../../../../contexts/WebsocketContext', () => ({
  useWebsocket: () => d1.mockSocket
}))

import { DashboardOrdersList } from '../index'

describe('DashboardOrdersList', () => {
  beforeEach(() => d1.reset())

  it('uses orders prop without API fetch', () => {
    renderController(DashboardOrdersList, {
      orders: [d1.sampleOrder],
      orderStatus: [0],
      allowColumns: d1.allowColumns,
      setAllowColumns: vi.fn()
    })
    expect(lastControllerProps.orderList.orders).toEqual([d1.sampleOrder])
    expect(d1.mockOrdersListGet).not.toHaveBeenCalled()
  })

  it('updates order status and removes from list', async () => {
    renderController(DashboardOrdersList, {
      orders: [d1.sampleOrder],
      orderStatus: [0, 1],
      allowColumns: d1.allowColumns,
      setAllowColumns: vi.fn()
    })
    await act(async () => {
      await lastControllerProps.handleUpdateOrderStatus({ id: 101, newStatus: 1 })
    })
    expect(d1.mockOrderSave).toHaveBeenCalled()
    expect(lastControllerProps.orderList.orders).toHaveLength(0)
  })

  it('reorders columns on drag and drop', () => {
    const setAllowColumns = vi.fn()
    renderController(DashboardOrdersList, {
      orders: [d1.sampleOrder],
      orderStatus: [0],
      allowColumns: d1.allowColumns,
      setAllowColumns
    })
    const event = {
      preventDefault: vi.fn(),
      dataTransfer: { getData: vi.fn(() => 'dateTime') }
    }
    act(() => {
      lastControllerProps.handleDrop(event, 'status')
    })
    expect(setAllowColumns).toHaveBeenCalled()
  })

  it('handles websocket order update for matching order', async () => {
    renderController(DashboardOrdersList, {
      orders: [d1.sampleOrder],
      orderStatus: [0, 7],
      filterValues: { businessIds: [], driverIds: [], deliveryTypes: [], paymethodIds: [], statuses: [] },
      allowColumns: d1.allowColumns,
      setAllowColumns: vi.fn()
    })
    await waitFor(() => expect(d1.mockSocket.on).toHaveBeenCalled())
    const updateHandler = d1.mockSocket.on.mock.calls.filter(([e]) => e === 'update_order').pop()?.[1]
    act(() => {
      updateHandler({ id: 101, status: 7, driver_id: 4 })
    })
    expect(lastControllerProps.orderList.orders[0].status).toBe(7)
  })

  it('registers pending orders from websocket', async () => {
    renderController(DashboardOrdersList, {
      orders: [],
      orderStatus: [0, 13],
      filterValues: { businessIds: [], driverIds: [], deliveryTypes: [], paymethodIds: [], statuses: [] },
      allowColumns: d1.allowColumns,
      setAllowColumns: vi.fn()
    })
    await waitFor(() => expect(d1.mockSocket.on).toHaveBeenCalled())
    const registerHandler = d1.mockSocket.on.mock.calls.find(([e]) => e === 'orders_register')?.[1]
    act(() => {
      registerHandler({ id: 303, status: 0, business_id: 1, products: [{ type: 'item' }] })
    })
    expect(lastControllerProps.orderList.orders[0]?.id).toBe(303)
  })
})
