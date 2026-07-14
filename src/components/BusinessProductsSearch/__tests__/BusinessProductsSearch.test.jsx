import { describe, it, expect, vi } from 'vitest'
import { renderController, lastControllerProps } from '../../../__tests__/helpers/renderController'
import { BusinessProductsSearch } from '../index'

describe('BusinessProductsSearch', () => {
  it('wires search handler to UI', () => {
    const onChangeSearch = vi.fn()
    renderController(BusinessProductsSearch, { onChangeSearch })
    expect(lastControllerProps.handleChangeSearch).toBe(onChangeSearch)
  })
})
