import { describe, it, expect, vi, beforeEach } from 'vitest'
import { waitFor } from '@testing-library/react'
import { renderController, lastControllerProps } from '../../../__tests__/helpers/renderController'

const pay = vi.hoisted(() => {
  const { createPaymentTestContext } = require('../../../__tests__/helpers/paymentTestHelpers')
  return createPaymentTestContext(vi)
})

vi.mock('../../../contexts/SessionContext', () => ({
  useSession: () => [{
    auth: true,
    loading: false,
    user: { id: 8, name: 'Test User' },
    token: 'session-tok',
    device_code: null
  }]
}))

vi.mock('../../../contexts/ApiContext', () => ({
  useApi: () => [pay.mockOrdering]
}))

vi.mock('../../../contexts/WebsocketContext', () => ({
  useWebsocket: () => ({ getId: () => 'socket-15' })
}))

import { PaymentOptionStripe } from '../index'

describe('PaymentOptionStripe', () => {
  const baseProps = () => ({
    businessId: 5,
    gateway: 'stripe',
    publicKey: 'pk_prop',
    onPaymentChange: vi.fn(),
    setCardList: vi.fn(),
    paymethodSelectedInfo: { id: 2, gateway: 'stripe' }
  })

  beforeEach(() => pay.reset())

  it('loads saved cards from API', async () => {
    renderController(PaymentOptionStripe, baseProps())
    await waitFor(() => {
      expect(lastControllerProps.cardsList.loading).toBe(false)
    })
    expect(lastControllerProps.cardsList.cards).toHaveLength(1)
    expect(lastControllerProps.cardDefault.card.last4).toBe('4242')
  })

  it('skips card storage for credomatic gateway', async () => {
    renderController(PaymentOptionStripe, { ...baseProps(), gateway: 'credomatic' })
    await waitFor(() => {
      expect(lastControllerProps.cardsList.loading).toBe(false)
    })
    expect(lastControllerProps.cardsList.cards).toHaveLength(0)
    expect(pay.mockPaymentCardsGet).not.toHaveBeenCalled()
  })

  it('selects a card for checkout', async () => {
    renderController(PaymentOptionStripe, baseProps())
    await waitFor(() => expect(lastControllerProps.cardsList.cards).toHaveLength(1))
    const card = lastControllerProps.cardsList.cards[0]
    lastControllerProps.handleCardClick(card)
    await waitFor(() => {
      expect(lastControllerProps.cardSelected?.id).toBe(10)
    })
    expect(lastControllerProps.cardSelected.card.last4).toBe('4242')
  })

  it('sets default card through API', async () => {
    renderController(PaymentOptionStripe, baseProps())
    await waitFor(() => expect(lastControllerProps.cardsList.cards).toHaveLength(1))
    await lastControllerProps.setDefaultCard(lastControllerProps.cardsList.cards[0])
    await waitFor(() => {
      expect(lastControllerProps.defaultCardSetActionStatus.loading).toBe(false)
    })
    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.test/payments/stripe/cards/default',
      expect.objectContaining({ method: 'POST' })
    )
  })

  it('loads business user paymethods when get_cards feature is enabled', async () => {
    renderController(PaymentOptionStripe, {
      ...baseProps(),
      gateway: 'braintree',
      paymethodSelectedInfo: {
        id: 2,
        gateway: 'braintree',
        featured: 'get_cards'
      }
    })
    await waitFor(() => {
      expect(lastControllerProps.cardsList.cards).toHaveLength(1)
    })
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/users/8/paymethods/2/paymethods'),
      expect.any(Object)
    )
  })

  it('deletes a saved card and clears selection', async () => {
    const onPaymentChange = vi.fn()
    renderController(PaymentOptionStripe, {
      ...baseProps(),
      paySelected: { data: { id: 10 } },
      onPaymentChange
    })
    await waitFor(() => expect(lastControllerProps.cardsList.cards).toHaveLength(1))
    await lastControllerProps.deleteCard(lastControllerProps.cardsList.cards[0])
    expect(pay.mockPaymentCardsDelete).toHaveBeenCalled()
  })

  it('adds a newly created card to the list', async () => {
    renderController(PaymentOptionStripe, baseProps())
    await waitFor(() => expect(lastControllerProps.cardsList.loading).toBe(false))
    const newCard = { id: 15, brand: 'amex', last4: '0005' }
    lastControllerProps.handleNewCard(newCard)
    await waitFor(() => {
      expect(lastControllerProps.cardSelected?.id).toBe(15)
    })
    expect(lastControllerProps.cardsList.cards[0].id).toBe(15)
  })

  it('loads izipay user cards when get_cards feature is enabled', async () => {
    renderController(PaymentOptionStripe, {
      ...baseProps(),
      gateway: 'izipay',
      paymethodSelectedInfo: {
        id: 3,
        gateway: 'izipay',
        featured: 'get_cards'
      }
    })
    await waitFor(() => {
      expect(lastControllerProps.cardsList.cards).toHaveLength(1)
    })
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/users/8/paymethods/3/paymethods?where='),
      expect.any(Object)
    )
  })
})
