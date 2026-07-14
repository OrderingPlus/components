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

import { MetaFields } from '../index'

describe('MetaFields', () => {
  beforeEach(() => d3.reset())

  it('loads metafields for order', async () => {
    renderController(MetaFields, { orderId: 101 })
    await waitFor(() => {
      expect(lastControllerProps.metaFieldsList.metaFields).toHaveLength(1)
    })
  })

  it('adds a metafield', async () => {
    renderController(MetaFields, { orderId: 101 })
    await waitFor(() => expect(lastControllerProps.metaFieldsList.metaFields).toHaveLength(1))
    await act(async () => {
      await lastControllerProps.handeAddMetaField({ key: 'note', value: 'vip' })
    })
    expect(lastControllerProps.metaFieldsList.metaFields).toHaveLength(2)
  })

  it('deletes a metafield', async () => {
    renderController(MetaFields, { orderId: 101 })
    await waitFor(() => expect(lastControllerProps.metaFieldsList.metaFields).toHaveLength(1))
    await act(async () => {
      await lastControllerProps.handleDeleteMetaField(1)
    })
    expect(lastControllerProps.metaFieldsList.metaFields).toHaveLength(0)
  })
})
