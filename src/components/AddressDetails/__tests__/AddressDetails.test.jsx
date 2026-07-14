import { describe, it, expect, vi, beforeEach } from 'vitest'
import { waitFor } from '@testing-library/react'
import { renderController, lastControllerProps } from '../../../__tests__/helpers/renderController'

const addr = vi.hoisted(() => {
  const {
    createAddressApiMocks,
    applyDefaultAddressMockImplementations,
    buildMockOrdering,
    defaultAddressConfigs
  } = require('../../../__tests__/helpers/addressPhoneTestHelpers')
  const api = createAddressApiMocks(vi)
  const mockOrdering = buildMockOrdering(vi, api)
  const reset = () => {
    vi.clearAllMocks()
    applyDefaultAddressMockImplementations(vi, api)
  }
  return { ...api, mockOrdering, reset, defaultAddressConfigs }
})

vi.mock('../../../contexts/OrderContext', () => ({
  useOrder: () => [{ options: { type: 1 } }]
}))

vi.mock('../../../contexts/ApiContext', () => ({
  useApi: () => [addr.mockOrdering]
}))

vi.mock('../../../contexts/ConfigContext', () => ({
  useConfig: () => [{ configs: addr.defaultAddressConfigs }]
}))

import { AddressDetails } from '../index'

describe('AddressDetails', () => {
  beforeEach(() => addr.reset())

  it('builds static map url from business location', async () => {
    renderController(AddressDetails, { businessId: 4 })
    await waitFor(() => {
      expect(lastControllerProps.googleMapsUrl).toContain('maps.googleapis.com')
    })
    expect(addr.mockBusinessGet).toHaveBeenCalled()
  })

  it('uses provided location without fetching business', () => {
    renderController(AddressDetails, {
      businessId: 4,
      location: { lat: 10, lng: 20 },
      businessLogo: 'biz.png'
    })
    expect(lastControllerProps.googleMapsUrl).toContain('maps.googleapis.com')
    expect(addr.mockBusinessGet).not.toHaveBeenCalled()
  })
})
