import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderController, getControllerUI, lastControllerProps } from '../../../__tests__/helpers/renderController'
import { OrderTypeControl } from '../index'

const changeType = vi.fn()
const emit = vi.fn()

vi.mock('../../../contexts/OrderContext', () => ({
  useOrder: () => [{ options: { type: 1 } }, { changeType }]
}))

vi.mock('../../../contexts/ConfigContext', () => ({
  useConfig: () => [{ configs: { unaddressed_order_types_allowed: { value: '2|5' } } }]
}))

vi.mock('../../../contexts/EventContext', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    useEvent: () => [{ emit }]
  }
})

describe('OrderTypeControl', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders UIComponent with selected order type', () => {
    renderController(OrderTypeControl)
    expect(getControllerUI()).toBeInTheDocument()
    expect(lastControllerProps.typeSelected).toBe(1)
    expect(typeof lastControllerProps.handleChangeOrderType).toBe('function')
  })

  it('emits require_order_address for address-required types', async () => {
    renderController(OrderTypeControl)
    await lastControllerProps.handleChangeOrderType(1)
    expect(changeType).toHaveBeenCalledWith(1)
    expect(emit).toHaveBeenCalledWith('require_order_address', { orderType: 1 })
  })

  it('does not emit when order type is unaddressed', async () => {
    renderController(OrderTypeControl)
    await lastControllerProps.handleChangeOrderType(2)
    expect(changeType).toHaveBeenCalledWith(2)
    expect(emit).not.toHaveBeenCalled()
  })
})
