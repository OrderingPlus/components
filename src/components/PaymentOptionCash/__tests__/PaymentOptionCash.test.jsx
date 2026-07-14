import { describe, it, expect } from 'vitest'
import { renderController, lastControllerProps } from '../../../__tests__/helpers/renderController'
import { PaymentOptionCash } from '../index'

describe('PaymentOptionCash', () => {
  it('passes order total through to UI', () => {
    renderController(PaymentOptionCash, { orderTotal: 55 })
    expect(lastControllerProps.total).toBe(55)
  })
})
