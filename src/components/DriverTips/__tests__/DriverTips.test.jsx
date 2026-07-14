import { describe, it, expect, vi, beforeEach } from 'vitest'
import { waitFor, act } from '@testing-library/react'
import { renderController, lastControllerProps } from '../../../__tests__/helpers/renderController'

const dmm = vi.hoisted(() => {
  const { createDriverMessagesMapTestContext } = require('../../../__tests__/helpers/driverMessagesMapTestHelpers')
  return createDriverMessagesMapTestContext(vi)
})

vi.mock('../../../contexts/OrderContext', () => ({
  useOrder: () => [dmm.mockOrderState, { changeDriverTip: dmm.mockChangeDriverTip }]
}))

vi.mock('../../../contexts/ConfigContext', () => ({
  useConfig: () => [{ configs: dmm.mockConfigState }]
}))

import { DriverTips } from '../index'

describe('DriverTips', () => {
  beforeEach(() => dmm.reset())

  it('throws when useOrderContext is true without business id', () => {
    expect(() => renderController(DriverTips, { useOrderContext: true })).toThrow(
      '`businessId` is required when `useOrderContext` is true.'
    )
  })

  it('syncs tip state from order cart on mount', async () => {
    renderController(DriverTips, { businessId: 5, useOrderContext: true })
    await waitFor(() => {
      expect(lastControllerProps.optionSelected).toBe(15)
      expect(lastControllerProps.driverTipAmount).toBe(2)
    })
  })

  it('updates driver tip for a single business cart', async () => {
    renderController(DriverTips, {
      businessId: 5,
      useOrderContext: true,
      handlerChangeDriverOption: dmm.mockHandlerChangeDriverOption
    })
    act(() => {
      lastControllerProps.handlerChangeOption(20)
    })
    expect(dmm.mockChangeDriverTip).toHaveBeenCalledWith(5, 20, undefined)
    expect(dmm.mockHandlerChangeDriverOption).toHaveBeenCalledWith(20)
  })

  it('splits fixed tips across multiple business carts', async () => {
    dmm.mockConfigState.driver_tip_type.value = '1'
    renderController(DriverTips, {
      businessIds: [5, 6, 7],
      useOrderContext: true,
      isFixedPrice: true
    })
    act(() => {
      lastControllerProps.handlerChangeOption(3)
    })
    expect(dmm.mockChangeDriverTip).toHaveBeenCalledTimes(3)
  })

  it('stores selected tip locally when order context is disabled', () => {
    renderController(DriverTips, { useOrderContext: false })
    act(() => {
      lastControllerProps.handlerChangeOption(18)
    })
    expect(lastControllerProps.optionSelected).toBe(18)
    expect(dmm.mockChangeDriverTip).not.toHaveBeenCalled()
  })
})
