import { describe, it, expect, vi, beforeEach } from 'vitest'
import { waitFor } from '@testing-library/react'
import { renderController, lastControllerProps } from '../../../__tests__/helpers/renderController'

const dmm = vi.hoisted(() => {
  const { createDriverMessagesMapTestContext } = require('../../../__tests__/helpers/driverMessagesMapTestHelpers')
  return createDriverMessagesMapTestContext(vi)
})

vi.mock('../../../contexts/ApiContext', () => ({
  useApi: () => [dmm.mockOrdering]
}))

import { DriverList } from '../index'

describe('DriverList', () => {
  beforeEach(() => dmm.reset())

  it('fetches drivers from API on mount', async () => {
    renderController(DriverList, {})
    await waitFor(() => {
      expect(lastControllerProps.driverList.loading).toBe(false)
    })
    expect(lastControllerProps.driverList.drivers).toHaveLength(1)
    expect(dmm.mockUsersGet).toHaveBeenCalled()
  })

  it('uses drivers prop without fetching', () => {
    renderController(DriverList, { drivers: [dmm.sampleDriver] })
    expect(lastControllerProps.driverList.drivers).toHaveLength(1)
    expect(lastControllerProps.driverList.loading).toBe(false)
    expect(dmm.mockUsersGet).not.toHaveBeenCalled()
  })

  it('surfaces API errors when driver fetch fails', async () => {
    dmm.mockUsersGet.mockResolvedValueOnce({
      content: { error: true, result: ['Driver fetch failed'] }
    })
    renderController(DriverList, {})
    await waitFor(() => {
      expect(lastControllerProps.driverList.error).toBeTruthy()
    })
  })
})
