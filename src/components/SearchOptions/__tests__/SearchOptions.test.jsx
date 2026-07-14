import { describe, it, expect, vi, beforeEach } from 'vitest'
import { act } from '@testing-library/react'
import { renderController, lastControllerProps } from '../../../__tests__/helpers/renderController'

const dmm = vi.hoisted(() => {
  const { createDriverMessagesMapTestContext } = require('../../../__tests__/helpers/driverMessagesMapTestHelpers')
  return createDriverMessagesMapTestContext(vi)
})

import { SearchOptions } from '../index'

describe('SearchOptions', () => {
  beforeEach(() => dmm.reset())

  it('toggles search option selection', () => {
    renderController(SearchOptions, {})
    act(() => {
      lastControllerProps.handleClickOption('delivery')
    })
    expect(lastControllerProps.optionSelected).toBe('delivery')
    act(() => {
      lastControllerProps.handleClickOption('delivery')
    })
    expect(lastControllerProps.optionSelected).toBe(null)
  })
})
