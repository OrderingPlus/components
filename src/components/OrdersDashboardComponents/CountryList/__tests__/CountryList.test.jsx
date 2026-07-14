import { describe, it, expect, vi, beforeEach } from 'vitest'
import { waitFor, act } from '@testing-library/react'
import { renderController, lastControllerProps } from '../../../../__tests__/helpers/renderController'

const d3 = vi.hoisted(() => {
  const { createDashboardBusinessTestContext } = require('../../../../__tests__/helpers/dashboardBusinessTestHelpers')
  return createDashboardBusinessTestContext(vi)
})

vi.mock('../../../../contexts/SessionContext', () => ({
  useSession: () => [d3.mockSessionState, { changeUser: vi.fn() }]
}))

vi.mock('../../../../contexts/ApiContext', () => ({
  useApi: () => [d3.mockOrdering]
}))

import { CountryList } from '../index'

describe('CountryList', () => {
  beforeEach(() => d3.reset())

  it('loads countries on mount', async () => {
    renderController(CountryList, { onClose: vi.fn() })
    await waitFor(() => {
      expect(lastControllerProps.countriesState.countries).toHaveLength(1)
    })
  })

  it('filters businesses by country code', async () => {
    const handleChangeFilterList = vi.fn()
    const handleChangeCode = vi.fn()
    renderController(CountryList, {
      filterList: { businessIds: null },
      handleChangeFilterList,
      handleChangeCode,
      onClose: vi.fn()
    })
    act(() => {
      lastControllerProps.setCode('US')
    })
    await act(async () => {
      await lastControllerProps.handleClickFilterButton()
    })
    expect(handleChangeFilterList).toHaveBeenCalledWith({ businessIds: [5] })
    expect(handleChangeCode).toHaveBeenCalledWith('US')
  })

  it('clears business filter when code is empty', async () => {
    const handleChangeFilterList = vi.fn()
    const handleChangeCode = vi.fn()
    renderController(CountryList, {
      filterList: { businessIds: [5] },
      handleChangeFilterList,
      handleChangeCode,
      onClose: vi.fn()
    })
    act(() => {
      lastControllerProps.setCode('')
    })
    await act(async () => {
      await lastControllerProps.handleClickFilterButton()
    })
    expect(handleChangeFilterList).toHaveBeenCalledWith({ businessIds: null })
  })
})
