import { describe, it, expect, vi } from 'vitest'
import { renderController, lastControllerProps } from '../../../__tests__/helpers/renderController'
import { FloatingButton } from '../index'

describe('FloatingButton', () => {
  it('maps handleClick to handleButtonClick', () => {
    const handleClick = vi.fn()
    renderController(FloatingButton, {
      btnText: 'Go',
      btnValue: 3,
      handleClick
    })
    expect(lastControllerProps.btnText).toBe('Go')
    expect(lastControllerProps.handleButtonClick).toBe(handleClick)
  })
})
