import { describe, it, expect, vi, beforeEach } from 'vitest'
import { waitFor } from '@testing-library/react'
import { renderController, lastControllerProps } from '../../../__tests__/helpers/renderController'

const biz = vi.hoisted(() => {
  const h = require('../../../__tests__/helpers/businessDiscoveryTestHelpers')
  const reset = () => {
    vi.clearAllMocks()
    h.setupFetchMock(vi)
  }
  return { reset }
})

import { BusinessTypeFilter } from '../index'

describe('BusinessTypeFilter', () => {
  beforeEach(() => biz.reset())

  it('fetches business types from API', async () => {
    const onChangeBusinessType = vi.fn()
    renderController(BusinessTypeFilter, { onChangeBusinessType })
    await waitFor(() => {
      expect(lastControllerProps.typesState.loading).toBe(false)
    })
    expect(lastControllerProps.typesState.types[0].name).toBe('All')
    expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/business_types'), expect.any(Object))
  })

  it('uses provided business types without fetching', async () => {
    const types = [{ id: 2, name: 'Grocery', enabled: true }]
    renderController(BusinessTypeFilter, { businessTypes: types })
    await waitFor(() => {
      expect(lastControllerProps.typesState.types).toEqual(types)
    })
  })

  it('notifies parent when type changes', async () => {
    const onChangeBusinessType = vi.fn()
    renderController(BusinessTypeFilter, { onChangeBusinessType })
    lastControllerProps.handleChangeBusinessType(1)
    expect(onChangeBusinessType).toHaveBeenCalledWith(1)
    await waitFor(() => {
      expect(lastControllerProps.currentTypeSelected).toBe(1)
    })
  })
})
