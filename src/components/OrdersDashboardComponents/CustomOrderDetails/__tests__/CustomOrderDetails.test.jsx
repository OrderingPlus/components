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

vi.mock('../../../../contexts/OrderContext', () => ({
  useOrder: () => [{
    carts: { 'businessId:1': { uuid: 'cart-1', products: [{ id: 5, quantity: 2 }] } }
  }, { updateProduct: d1.mockUpdateProduct }]
}))

vi.mock('../../../../contexts/ApiContext', () => ({
  useApi: () => [d1.mockOrdering]
}))

import { CustomOrderDetails } from '../index'

describe('CustomOrderDetails', () => {
  beforeEach(() => d1.reset())

  it('searches users when phone has enough digits', async () => {
    renderController(CustomOrderDetails, {})
    act(() => {
      lastControllerProps.onChangeNumber('5551234')
    })
    await waitFor(() => {
      expect(lastControllerProps.customersPhones.loading).toBe(false)
    })
    expect(d1.mockUsersGet).toHaveBeenCalled()
  })

  it('loads businesses for a location', async () => {
    renderController(CustomOrderDetails, {})
    await act(async () => {
      await lastControllerProps.getBusinessList({ lat: 40.7, lng: -74 })
    })
    expect(lastControllerProps.businessList.businesses).toHaveLength(1)
  })

  it('updates product quantity in cart', async () => {
    renderController(CustomOrderDetails, {})
    act(() => {
      lastControllerProps.setSelectedBusiness(d1.sampleBusiness)
      lastControllerProps.setSelectedUser({ id: 8 })
    })
    await act(async () => {
      await lastControllerProps.handeUpdateProductCart({ id: 5, quantity: 2 }, true)
    })
    expect(d1.mockUpdateProduct).toHaveBeenCalled()
    expect(d1.mockShowToast).toHaveBeenCalled()
  })

  it('loads products for selected business', async () => {
    renderController(CustomOrderDetails, {})
    act(() => {
      lastControllerProps.setSelectedBusiness(d1.sampleBusiness)
    })
    await act(async () => {
      await lastControllerProps.getProducts('burger')
    })
    expect(lastControllerProps.productList.products).toHaveLength(1)
  })
})
