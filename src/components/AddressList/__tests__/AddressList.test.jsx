import { describe, it, expect, vi, beforeEach } from 'vitest'
import { waitFor } from '@testing-library/react'
import { renderController, lastControllerProps } from '../../../__tests__/helpers/renderController'

const addr = vi.hoisted(() => {
  const {
    createAddressApiMocks,
    applyDefaultAddressMockImplementations,
    buildMockOrdering,
    createMockSocket
  } = require('../../../__tests__/helpers/addressPhoneTestHelpers')
  const api = createAddressApiMocks(vi)
  const mockChangeAddress = vi.fn()
  const mockOrdering = buildMockOrdering(vi, api)
  const mockSocket = createMockSocket(vi)
  const reset = () => {
    vi.clearAllMocks()
    applyDefaultAddressMockImplementations(vi, api)
  }
  return { ...api, mockOrdering, mockChangeAddress, mockSocket, reset }
})

vi.mock('../../../contexts/SessionContext', () => ({
  useSession: () => [{ auth: true, user: { id: 8 }, token: 'session-tok' }]
}))

vi.mock('../../../contexts/CustomerContext', () => ({
  useCustomer: () => [{}, { setUserCustomer: vi.fn() }]
}))

vi.mock('../../../contexts/OrderContext', () => ({
  useOrder: () => [{
    options: { type: 1, address: { location: { lat: 40.7, lng: -74 } } }
  }, { changeAddress: addr.mockChangeAddress }]
}))

vi.mock('../../../contexts/ApiContext', () => ({
  useApi: () => [addr.mockOrdering]
}))

vi.mock('../../../contexts/WebsocketContext', () => ({
  useWebsocket: () => addr.mockSocket
}))

import { AddressList } from '../index'

describe('AddressList', () => {
  beforeEach(() => addr.reset())

  it('loads addresses on mount', async () => {
    renderController(AddressList, {})
    await waitFor(() => {
      expect(lastControllerProps.addressList.loading).toBe(false)
    })
    expect(lastControllerProps.addressList.addresses).toHaveLength(1)
    expect(typeof lastControllerProps.handleDelete).toBe('function')
  })

  it('delegates set-default to custom handler', async () => {
    const handleClickSetDefault = vi.fn()
    renderController(AddressList, { handleClickSetDefault })
    await waitFor(() => {
      expect(lastControllerProps.addressList.addresses).toHaveLength(1)
    })
    await lastControllerProps.handleSetDefault({ id: 1, country_code: 'US' })
    expect(handleClickSetDefault).toHaveBeenCalled()
  })

  it('deletes an address via API', async () => {
    renderController(AddressList, {})
    await waitFor(() => {
      expect(lastControllerProps.addressList.addresses).toHaveLength(1)
    })
    await lastControllerProps.handleDelete({ id: 1 })
    await waitFor(() => {
      expect(lastControllerProps.addressList.addresses).toHaveLength(0)
    })
  })

  it('sets default address through API', async () => {
    renderController(AddressList, { changeOrderAddressWithDefault: true })
    await waitFor(() => {
      expect(lastControllerProps.addressList.addresses).toHaveLength(1)
    })
    await lastControllerProps.handleSetDefault({
      id: 1,
      country_code: 'US',
      default: false
    })
    await waitFor(() => {
      expect(addr.mockAddressSave).toHaveBeenCalledWith({ default: true })
    })
    expect(addr.mockChangeAddress).toHaveBeenCalled()
  })
})
