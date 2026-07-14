import { describe, it, expect } from 'vitest'
import { renderController, lastControllerProps } from '../../../__tests__/helpers/renderController'
import { BaseComponent } from '../index'

describe('BaseComponent', () => {
  it('passes props through UIComponent', () => {
    renderController(BaseComponent, { title: 'Hello' })
    expect(lastControllerProps.title).toBe('Hello')
  })
})
