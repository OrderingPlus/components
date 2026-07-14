import { describe, it, expect, vi, beforeEach } from 'vitest'
import { waitFor, act } from '@testing-library/react'
import { renderController, lastControllerProps } from '../../../../__tests__/helpers/renderController'

const upm = vi.hoisted(() => {
  const { createUserProjectMiscTestContext } = require('../../../../__tests__/helpers/userProjectMiscTestHelpers')
  return createUserProjectMiscTestContext(vi)
})

vi.mock('../../../../contexts/EventContext', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    useEvent: () => [{ emit: upm.mockEmit }]
  }
})

vi.mock('../../../../contexts/SessionContext', () => ({
  useSession: () => [{
    auth: true,
    loading: false,
    user: upm.sampleUser,
    token: 'session-tok'
  }]
}))

vi.mock('../../../../contexts/OrderContext', () => ({
  useOrder: () => [upm.mockOrderState, {
    changeMoment: upm.mockChangeMoment,
    addProduct: upm.mockAddProduct,
    removeProduct: upm.mockRemoveProduct
  }]
}))

vi.mock('../../../../contexts/ApiContext', () => ({
  useApi: () => [upm.mockOrdering, { setOrdering: upm.mockSetOrdering }]
}))

vi.mock('../../../../contexts/WebsocketContext', () => ({
  useWebsocket: () => upm.mockSocket
}))

import { PurchaseGiftCard } from '../index'

describe('PurchaseGiftCard', () => {
  beforeEach(() => upm.reset())

  it('loads platform gift products', async () => {
    renderController(PurchaseGiftCard, {})
    await waitFor(() => {
      expect(lastControllerProps.productsListState.loading).toBe(false)
    })
    expect(lastControllerProps.productsListState.products).toHaveLength(1)
  })

  it('goes to checkout when gift already in cart', async () => {
    renderController(PurchaseGiftCard, {
      handleCustomGoToCheckout: upm.mockHandleCustomGoToCheckout
    })
    await waitFor(() => expect(lastControllerProps.productsListState.products).toHaveLength(1))
    act(() => {
      lastControllerProps.setSelectedProduct(upm.giftProduct)
    })
    await act(async () => {
      await lastControllerProps.handleAccept(upm.giftProduct)
    })
    expect(upm.mockHandleCustomGoToCheckout).toHaveBeenCalledWith('gift-cart-uuid')
  })

  it('adds product and redirects to checkout', async () => {
    upm.mockOrderState.carts = { 'businessId:5': { business_id: 5, uuid: 'cart-5', products: [] } }
    renderController(PurchaseGiftCard, {})
    await waitFor(() => expect(lastControllerProps.productsListState.products).toHaveLength(1))
    await act(async () => {
      await lastControllerProps.handleAccept(upm.giftProduct)
    })
    expect(upm.mockAddProduct).toHaveBeenCalled()
    expect(upm.mockEmit).toHaveBeenCalledWith('go_to_page', {
      page: 'checkout',
      params: { cartUuid: 'new-gift-cart' }
    })
  })
})
