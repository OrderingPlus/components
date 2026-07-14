import { describe, it, expect, vi, beforeEach } from 'vitest'
import { waitFor } from '@testing-library/react'
import { renderController, lastControllerProps } from '../../../__tests__/helpers/renderController'

const cart = vi.hoisted(() => {
  const { createCartCheckoutTestContext } = require('../../../__tests__/helpers/cartCheckoutTestHelpers')
  return createCartCheckoutTestContext(vi)
})

vi.mock('../../../contexts/EventContext', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    useEvent: () => [{ emit: cart.mockEmit }]
  }
})

vi.mock('../../../contexts/SessionContext', () => ({
  useSession: () => [{
    auth: true,
    user: { id: 8 },
    token: 'session-tok'
  }]
}))

vi.mock('../../../contexts/CustomerContext', () => ({
  useCustomer: () => [{ user: { id: 12 } }]
}))

vi.mock('../../../contexts/OrderContext', () => ({
  useOrder: () => [cart.mockOrderState, {
    setStateValues: cart.mockSetStateValues
  }]
}))

vi.mock('../../../contexts/ApiContext', () => ({
  useApi: () => [cart.mockOrdering]
}))

import { CartStoresListing } from '../index'

describe('CartStoresListing', () => {
  beforeEach(() => cart.reset())

  it('skips API fetch when cartStoresList prop is provided', async () => {
    const stores = [{ id: 5, name: 'Store Alpha' }]
    renderController(CartStoresListing, { cartuuid: 'cart-uuid-5', cartStoresList: stores })
    await waitFor(() => {
      expect(lastControllerProps.storesState.loading).toBe(false)
    })
    expect(cart.mockGetBusinesses).not.toHaveBeenCalled()
  })

  it('filters stores by search value', async () => {
    renderController(CartStoresListing, { cartuuid: 'cart-uuid-5' })
    await waitFor(() => {
      expect(lastControllerProps.storesState.result).toHaveLength(2)
    })
    lastControllerProps.handleChangeSearch('beta')
    await waitFor(() => {
      expect(lastControllerProps.storesState.result).toHaveLength(1)
    })
    expect(lastControllerProps.storesState.result[0].name).toBe('Store Beta')
  })

  it('changes cart store and calls custom redirect', async () => {
    const handleCustomStoreRedirect = vi.fn()
    const onClose = vi.fn()
    renderController(CartStoresListing, {
      cartuuid: 'cart-uuid-5',
      cartStoresList: [{ id: 7, name: 'Store Beta' }],
      isStore: true,
      handleCustomStoreRedirect,
      onClose
    })
    await lastControllerProps.handleCartStoreChange(7)
    await waitFor(() => {
      expect(cart.mockSetStateValues).toHaveBeenCalled()
    })
    expect(handleCustomStoreRedirect).toHaveBeenCalledWith('store-beta')
    expect(onClose).toHaveBeenCalled()
  })
})
