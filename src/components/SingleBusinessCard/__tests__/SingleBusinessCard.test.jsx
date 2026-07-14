import { describe, it, expect } from 'vitest'
import { renderController, lastControllerProps } from '../../../__tests__/helpers/renderController'
import { SingleBusinessCard } from '../index'

describe('SingleBusinessCard', () => {
  it('passes props through to UI', () => {
    renderController(SingleBusinessCard, { name: 'Cafe', delivery_price: 2.5 })
    expect(lastControllerProps.name).toBe('Cafe')
    expect(lastControllerProps.delivery_price).toBe(2.5)
  })
})
