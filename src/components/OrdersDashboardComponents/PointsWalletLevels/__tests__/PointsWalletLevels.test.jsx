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

import { PointsWalletLevels } from '../index'

describe('PointsWalletLevels', () => {
  beforeEach(() => d3.reset())

  it('loads loyalty levels on mount', async () => {
    renderController(PointsWalletLevels, {})
    await waitFor(() => {
      expect(lastControllerProps.levelList.levels).toHaveLength(1)
    })
  })

  it('adds, updates, and deletes levels locally', async () => {
    renderController(PointsWalletLevels, {})
    await waitFor(() => expect(lastControllerProps.levelList.levels).toHaveLength(1))
    act(() => {
      lastControllerProps.handleAddLevelList({ id: 2, name: 'Silver', points: 500 })
    })
    expect(lastControllerProps.levelList.levels).toHaveLength(2)
    act(() => {
      lastControllerProps.handleUpdateLevelList({ id: 1, name: 'Bronze Plus', points: 150 })
    })
    expect(lastControllerProps.levelList.levels[0].name).toBe('Bronze Plus')
    act(() => {
      lastControllerProps.handleDeleteLevelList({ id: 2 })
    })
    expect(lastControllerProps.levelList.levels).toHaveLength(1)
  })
})
