import { describe, it, expect, vi } from 'vitest'
import { renderController, lastControllerProps } from '../../../__tests__/helpers/renderController'
import { Popup } from '../index'

describe('Popup', () => {
  it('renders UIComponent in portal when open', () => {
    const onClose = vi.fn()
    renderController(Popup, { open: true, onClose, title: 'Modal' })
    expect(lastControllerProps.title).toBe('Modal')
    expect(document.getElementById('app-modals')).toBeTruthy()
  })
})
