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
  const mockChangeAddress = vi.fn()
  const mockLogin = vi.fn()
  const mockSetUserCustomer = vi.fn()
  const mockShowToast = vi.fn()
  const state = { sessionAuth: true, testUseAlternativeMap: '0' }
  const mockOrdering = buildMockOrdering(vi, api)
  const reset = () => {
    state.sessionAuth = true
    state.testUseAlternativeMap = '0'
    vi.clearAllMocks()
    window.localStorage.clear()
    applyDefaultAddressMockImplementations(vi, api)
    global.fetch = vi.fn().mockResolvedValue({
      json: async () => ({ error: false, result: [{ id: 2, open: true, name: 'Near Store' }] })
    })
  }
  return { ...api, mockOrdering, mockChangeAddress, mockLogin, mockSetUserCustomer, mockShowToast, state, reset, defaultAddressConfigs }
})

vi.mock('../../../contexts/SessionContext', () => ({
  useSession: () => [{
    auth: addr.state.sessionAuth,
    user: { id: 8 },
    token: 'session-tok'
  }, { login: addr.mockLogin, refreshUserInfo: vi.fn() }]
}))

vi.mock('../../../contexts/LanguageContext', () => ({
  useLanguage: () => [{ language: { code: 'en' } }, (key, fallback) => fallback || key]
}))

vi.mock('../../../contexts/ToastContext', () => ({
  useToast: () => [[], { showToast: addr.mockShowToast }],
  ToastType: { error: 'error', success: 'success' }
}))

vi.mock('../../../contexts/ValidationsFieldsContext', () => ({
  useValidationFields: () => [{
    loading: false,
    fields: {
      address: {
        address: { enabled: true, required: true },
        zipcode: { enabled: false }
      }
    }
  }]
}))

vi.mock('../../../contexts/CustomerContext', () => ({
  useCustomer: () => [{}, { setUserCustomer: addr.mockSetUserCustomer }]
}))

vi.mock('../../../contexts/OrderContext', () => ({
  useOrder: () => [{
    options: { type: 1, address: { location: { lat: 40.7, lng: -74 } } },
    carts: {}
  }, { changeAddress: addr.mockChangeAddress, setUserCustomerOptions: vi.fn() }]
}))

vi.mock('../../../contexts/ConfigContext', () => ({
  useConfig: () => [{
    configs: {
      ...addr.defaultAddressConfigs,
      use_alternative_to_google_maps: { value: addr.state.testUseAlternativeMap }
    }
  }]
}))

vi.mock('../../../contexts/ApiContext', () => ({
  useApi: () => [addr.mockOrdering]
}))

import { AddressForm } from '../index'

describe('AddressForm', () => {
  beforeEach(() => addr.reset())

  it('exposes form helpers and validation utilities', () => {
    renderController(AddressForm, { useValidationFileds: true })
    expect(typeof lastControllerProps.handleChangeInput).toBe('function')
    expect(typeof lastControllerProps.saveAddress).toBe('function')
    expect(lastControllerProps.showField('address')).toBe(true)
    expect(lastControllerProps.showField('zipcode')).toBe(false)
    expect(lastControllerProps.isRequiredField('address')).toBe(true)
    expect(lastControllerProps.isRequiredField('zipcode')).toBe(false)
  })

  it('updates changes through handleChangeInput', async () => {
    renderController(AddressForm, {})
    lastControllerProps.handleChangeInput({ target: { name: 'address', value: '742 Evergreen' } })
    await waitFor(() => {
      expect(lastControllerProps.formState.changes.address).toBe('742 Evergreen')
    })
  })

  it('delegates to onSaveCustomAddress when provided', async () => {
    const onSaveCustomAddress = vi.fn()
    renderController(AddressForm, { onSaveCustomAddress })
    await lastControllerProps.saveAddress({ address: 'Custom' })
    expect(onSaveCustomAddress).toHaveBeenCalledWith({ address: 'Custom' })
  })

  it('saves address for authenticated users', async () => {
    renderController(AddressForm, {})
    await lastControllerProps.saveAddress({ address: 'Saved St' })
    await waitFor(() => {
      expect(addr.mockAddressSave).toHaveBeenCalled()
    })
    expect(lastControllerProps.addressState.address.address).toBe('New St')
  })

  it('loads address by id on mount', async () => {
    renderController(AddressForm, { addressId: 5 })
    await waitFor(() => {
      expect(lastControllerProps.addressState.loading).toBe(false)
    })
    expect(addr.mockAddressGet).toHaveBeenCalled()
    expect(lastControllerProps.addressState.address.id).toBe(5)
  })

  it('fetches nearest business for a location', async () => {
    renderController(AddressForm, {})
    await lastControllerProps.getNearestBusiness({ lat: 40.7, lng: -74 })
    await waitFor(() => {
      expect(lastControllerProps.businessNearestState.loading).toBe(false)
    })
    expect(lastControllerProps.businessNearestState.business?.name).toBe('Near Store')
  })

  it('loads delivery zones for a location', async () => {
    renderController(AddressForm, { franchiseId: 9 })
    await lastControllerProps.getBusinessDeliveryZones({ lat: 40.7, lng: -74 })
    await waitFor(() => {
      expect(lastControllerProps.businessesList.loading).toBe(false)
    })
    expect(addr.mockBusinessZonesGet).toHaveBeenCalled()
    expect(lastControllerProps.businessesList.businesses).toHaveLength(1)
  })

  it('creates guest user and address when createGuestOnSave is enabled', async () => {
    addr.state.sessionAuth = false
    const onSaveAddress = vi.fn()
    renderController(AddressForm, { createGuestOnSave: true, onSaveAddress })
    await lastControllerProps.saveAddress({ address: 'Guest St', zipcode: '10001' })
    await waitFor(() => {
      expect(addr.mockGuestSave).toHaveBeenCalled()
    })
    expect(addr.mockLogin).toHaveBeenCalled()
    expect(onSaveAddress).toHaveBeenCalled()
    expect(addr.mockChangeAddress).toHaveBeenCalled()
  })

  it('fetches mapbox suggestions when alternative maps are enabled', async () => {
    addr.state.testUseAlternativeMap = '1'
    global.fetch = vi.fn()
      .mockResolvedValueOnce({
        json: async () => ({
          suggestions: [{
            mapbox_id: 'mb-1',
            context: { address: { address_number: '10' } }
          }]
        })
      })
      .mockResolvedValueOnce({
        json: async () => ({
          features: [{
            geometry: { coordinates: [-73.9, 40.1] },
            properties: {
              full_address: '10 Main St',
              mapbox_id: 'mb-1',
              context: {
                country: { name: 'US', country_code: 'US' },
                region: { name: 'NY', region_code: 'NY' },
                place: { name: 'NYC' },
                postcode: { name: '10001' },
                street: { name: 'Main' },
                address: { address_number: '10' }
              }
            }
          }]
        })
      })

    renderController(AddressForm, {})
    await lastControllerProps.getSuggestedResult('10 Main')
    await waitFor(() => {
      expect(lastControllerProps.mapBoxSuggests).toHaveLength(1)
    })

    const onSuggest = vi.fn()
    await lastControllerProps.retrieveSuggestResult('mb-1', onSuggest)
    expect(onSuggest).toHaveBeenCalledWith(expect.objectContaining({
      address: '10 Main St',
      country_code: 'US'
    }))
  })
})
