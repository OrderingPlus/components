import { describe, it, expect, vi } from 'vitest'
import { renderController, lastControllerProps } from '../../../__tests__/helpers/renderController'
import { ProductOptionSuboption } from '../index'

describe('ProductOptionSuboption', () => {
  const option = { id: 20, name: 'Size', max: 2, min: 0, with_half_option: false, limit_suboptions_by_max: false }
  const suboption = { id: 201, name: 'Large', price: 2, max: 3 }

  it('toggles suboption selection', () => {
    const onChange = vi.fn()
    renderController(ProductOptionSuboption, {
      option,
      suboption,
      balance: 0,
      state: { selected: false, quantity: 0 },
      onChange,
      isOrigin: true
    })
    lastControllerProps.toggleSelect()
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ selected: true, quantity: 1 }),
      suboption,
      option
    )
  })

  it('increments and decrements quantity', () => {
    const onChange = vi.fn()
    renderController(ProductOptionSuboption, {
      option,
      suboption,
      balance: 1,
      state: { selected: true, quantity: 1 },
      onChange
    })
    lastControllerProps.increment()
    lastControllerProps.decrement()
    expect(onChange).toHaveBeenCalledTimes(2)
  })

  it('changes pizza position and quantity', () => {
    const onChange = vi.fn()
    const pizzaOption = { ...option, with_half_option: true, allow_suboption_quantity: true, limit_suboptions_by_max: true, max: 2 }
    const halfSuboption = { ...suboption, half_price: 1, max: 2 }
    renderController(ProductOptionSuboption, {
      option: pizzaOption,
      suboption: halfSuboption,
      balance: 0.5,
      state: { selected: true, quantity: 1, position: 'left' },
      onChange,
      pizzaState: { 'option:20': { value: 0.5 } }
    })
    lastControllerProps.changePosition('whole')
    lastControllerProps.changeQuantity(2)
    expect(onChange).toHaveBeenCalled()
  })
})
