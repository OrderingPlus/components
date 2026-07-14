import { describe, it, expect, vi, beforeEach } from 'vitest'
import { waitFor, act } from '@testing-library/react'
import { renderController, lastControllerProps } from '../../../../__tests__/helpers/renderController'

const d2 = vi.hoisted(() => {
  const { createDashboardUsersTestContext } = require('../../../../__tests__/helpers/dashboardUsersTestHelpers')
  return createDashboardUsersTestContext(vi)
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

vi.mock('../../../../contexts/WebsocketContext', () => ({
  useWebsocket: () => d2.mockSocket
}))

import { DriversList } from '../index'

describe('DriversList', () => {
  beforeEach(() => d2.reset())

  it('uses drivers prop and splits online/offline', () => {
    renderController(DriversList, { drivers: [d2.sampleDriver, { ...d2.sampleDriver, id: 5, available: false }] })
    expect(lastControllerProps.driversList.drivers).toHaveLength(2)
    expect(lastControllerProps.onlineDrivers).toHaveLength(1)
    expect(lastControllerProps.offlineDrivers).toHaveLength(1)
  })

  it('assigns driver to order', async () => {
    renderController(DriversList, { drivers: [d2.sampleDriver] })
    await act(async () => {
      await lastControllerProps.handleAssignDriver({ orderId: 101, driverId: 4 })
    })
    expect(d2.mockOrderSave).toHaveBeenCalled()
    expect(d2.mockShowToast).toHaveBeenCalled()
  })

  it('filters drivers by online state', () => {
    renderController(DriversList, { drivers: [d2.sampleDriver] })
    act(() => {
      lastControllerProps.handleChangeDriverIsOnline(false)
    })
    expect(lastControllerProps.driversIsOnline).toBe(false)
  })

  it('handles websocket driver update', async () => {
    renderController(DriversList, { drivers: [d2.sampleDriver] })
    await waitFor(() => expect(d2.mockSocket.on).toHaveBeenCalled())
    const updateHandler = d2.mockSocket.on.mock.calls.find(([e]) => e === 'drivers_update')?.[1]
    act(() => {
      updateHandler({ id: 4, name: 'Updated Driver', enabled: true, available: true })
    })
    expect(lastControllerProps.driversList.drivers[0].name).toBe('Updated Driver')
  })

  it('fetches drivers and filters by search', async () => {
    renderController(DriversList, {})
    await waitFor(() => expect(lastControllerProps.driversList.loading).toBe(false))
    act(() => {
      lastControllerProps.handleChangeSearch('Driver')
    })
    await waitFor(() => expect(d2.mockUsersGet).toHaveBeenCalled())
  })

  it('handles tracking websocket with string location', async () => {
    renderController(DriversList, { drivers: [d2.sampleDriver] })
    await waitFor(() => expect(lastControllerProps.driversList.drivers).toHaveLength(1))
    const trackingCalls = d2.mockSocket.on.mock.calls.filter(([e]) => e === 'tracking_driver')
    const trackingHandler = trackingCalls[trackingCalls.length - 1]?.[1]
    act(() => {
      trackingHandler({
        driver_id: 4,
        location: '{"lat":1,"lng":2}'
      })
    })
    await waitFor(() => {
      expect(lastControllerProps.driversList.drivers[0].location).toEqual({ lat: 1, lng: 2 })
    })
  })

  it('toggles busy subfilter', () => {
    renderController(DriversList, { drivers: [d2.sampleDriver] })
    act(() => {
      lastControllerProps.handleChangeDriversSubFilter({ busy: false, notBusy: true })
    })
    expect(lastControllerProps.driversSubfilter.busy).toBe(false)
  })
})
