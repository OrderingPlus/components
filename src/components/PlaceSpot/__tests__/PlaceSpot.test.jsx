import { describe, it, expect, vi } from 'vitest'
import { waitFor } from '@testing-library/react'
import { renderController, lastControllerProps } from '../../../__tests__/helpers/renderController'

vi.mock('../../../contexts/LanguageContext', () => ({
  useLanguage: () => [{}, (key, fallback) => fallback || key]
}))

vi.mock('../../../contexts/SessionContext', () => ({
  useSession: () => [{ user: { id: 1 }, token: 'tok' }]
}))

vi.mock('../../../contexts/ConfigContext', () => ({
  useConfig: () => [{ configs: {} }]
}))

vi.mock('../../../contexts/OrderContext', () => ({
  useOrder: () => [{ options: { type: 1 } }]
}))

vi.mock('../../../contexts/ApiContext', () => ({
  useApi: () => [{ root: 'https://api.test' }]
}))

const mockSocket = {
  socket: { on: vi.fn(), off: vi.fn() },
  on: vi.fn(),
  off: vi.fn()
}

vi.mock('../../../contexts/WebsocketContext', () => ({
  useWebsocket: () => mockSocket
}))

vi.mock('../../../contexts/CustomerContext', () => ({
  useCustomer: () => [{ user: { id: 2 } }]
}))

vi.mock('../../../contexts/ToastContext', () => ({
  useToast: () => [[], { showToast: vi.fn() }],
  ToastType: { Success: 'success', Error: 'error' }
}))

import { PlaceSpot } from '../index'

describe('PlaceSpot', () => {
  it('renders with vehicle and spot handlers in input mode', () => {
    renderController(PlaceSpot, {
      isInputMode: true,
      cart: { id: 1, business_id: 2 },
      vehicleDefault: { type: 'car', model: 'Sedan' }
    })
    expect(lastControllerProps.vehicle.model).toBe('Sedan')
    expect(typeof lastControllerProps.handleChangeSpot).toBe('function')
    expect(typeof lastControllerProps.setSpotNumber).toBe('function')
  })

  it('updates spot number through handlers', async () => {
    renderController(PlaceSpot, {
      isInputMode: true,
      cart: { id: 1, business_id: 2 },
      vehicleDefault: { type: 'car', model: 'Sedan' }
    })
    lastControllerProps.setSpotNumber('A12')
    await waitFor(() => {
      expect(lastControllerProps.spotNumber).toBe('A12')
    })
  })
})
