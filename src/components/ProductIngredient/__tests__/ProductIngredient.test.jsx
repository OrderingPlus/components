import { describe, it, expect, vi } from 'vitest'
import { renderController, lastControllerProps } from '../../../__tests__/helpers/renderController'
import { ProductIngredient } from '../index'

describe('ProductIngredient', () => {
  it('toggles ingredient selection', () => {
    const onChange = vi.fn()
    const ingredient = { id: 1, name: 'Lettuce' }
    renderController(ProductIngredient, {
      ingredient,
      state: { selected: true },
      onChange
    })
    lastControllerProps.toggleSelect()
    expect(onChange).toHaveBeenCalledWith({ selected: false }, ingredient)
  })
})
