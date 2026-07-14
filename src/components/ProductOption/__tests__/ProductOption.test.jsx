import { describe, it, expect } from 'vitest'
import { renderController, lastControllerProps } from '../../../__tests__/helpers/renderController'
import { ProductOption } from '../index'

describe('ProductOption', () => {
  it('passes option props through to UI', () => {
    const option = { id: 20, name: 'Size' }
    renderController(ProductOption, { option, error: true })
    expect(lastControllerProps.option).toEqual(option)
    expect(lastControllerProps.error).toBe(true)
  })
})
