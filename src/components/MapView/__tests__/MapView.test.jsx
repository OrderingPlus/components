import { describe, it, expect, vi, beforeEach } from 'vitest'
import { waitFor, act } from '@testing-library/react'
import { renderController, lastControllerProps } from '../../../__tests__/helpers/renderController'

const dmm = vi.hoisted(() => {
  const { createDriverMessagesMapTestContext } = require('../../../__tests__/helpers/driverMessagesMapTestHelpers')
  return createDriverMessagesMapTestContext(vi)
})

vi.mock('../../../contexts/EventContext', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    useEvent: () => [{ emit: dmm.mockEmit, on: dmm.mockEventsOn, off: dmm.mockEventsOff }]
  }
})

vi.mock('../../../contexts/SessionContext', () => ({
  useSession: () => [{
    auth: true,
    loading: false,
    user: { id: 8, name: 'Test User', level: 4 },
    token: 'session-tok'
  }]
}))

vi.mock('../../../contexts/ApiContext', () => ({
  useApi: () => [dmm.mockOrdering]
}))

import { MapView } from '../index'

describe('MapView', () => {
  beforeEach(() => dmm.reset())

  it('loads dashboard orders and groups markers', async () => {
    renderController(MapView, {})
    await act(async () => {
      await lastControllerProps.getBusinessLocations()
    })
    await waitFor(() => {
      expect(lastControllerProps.isLoadingBusinessMarkers).toBe(false)
    })
    expect(lastControllerProps.businessMarkers).toHaveLength(2)
    expect(Object.keys(lastControllerProps.markerGroups)).toContain('5')
  })

  it('saves driver location through API', async () => {
    renderController(MapView, {})
    await act(async () => {
      await lastControllerProps.setDriverLocation({ lat: 11, lng: 22 })
    })
    expect(dmm.mockDriverLocationsSave).toHaveBeenCalledWith({ lat: 11, lng: 22 })
  })

  it('refreshes markers when order_updated fires', async () => {
    renderController(MapView, {})
    const updateHandlers = dmm.mockEventsOn.mock.calls.filter(([event]) => event === 'order_updated')
    const updateHandler = updateHandlers[updateHandlers.length - 1]?.[1]
    await act(async () => {
      await updateHandler?.(dmm.dashboardOrder)
    })
    expect(dmm.mockOrdersDashboardGet).toHaveBeenCalled()
  })
})
