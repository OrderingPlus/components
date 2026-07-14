import { describe, it, expect, vi, beforeEach } from 'vitest'
import { waitFor } from '@testing-library/react'
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

import { CityList } from '../index'

describe('CityList', () => {
  beforeEach(() => d3.reset())

  it('uses cities prop without API call', () => {
    renderController(CityList, { cities: [d3.sampleCity] })
    expect(lastControllerProps.citiesList.cities).toEqual([d3.sampleCity])
    expect(lastControllerProps.citiesList.loading).toBe(false)
  })

  it('loads cities from enabled countries', async () => {
    renderController(CityList, {})
    await waitFor(() => {
      expect(lastControllerProps.citiesList.loading).toBe(false)
    })
    expect(lastControllerProps.citiesList.cities).toEqual([d3.sampleCity])
  })
})
