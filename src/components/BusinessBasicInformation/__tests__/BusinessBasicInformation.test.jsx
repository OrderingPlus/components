import { describe, it, expect, vi, beforeEach } from 'vitest'
import { waitFor } from '@testing-library/react'
import { renderController, lastControllerProps } from '../../../__tests__/helpers/renderController'

const biz = vi.hoisted(() => {
  const h = require('../../../__tests__/helpers/businessDiscoveryTestHelpers')
  const api = h.createBusinessApiMocks(vi)
  const reset = () => {
    vi.clearAllMocks()
    h.applyDefaultBusinessMockImplementations(vi, api)
  }
  return {
    ...api,
    mockOrdering: h.buildBusinessMockOrdering(vi, api),
    reset,
    sampleBusiness: h.sampleBusiness
  }
})

vi.mock('../../../contexts/ApiContext', () => ({
  useApi: () => [biz.mockOrdering]
}))

import { BusinessBasicInformation } from '../index'

describe('BusinessBasicInformation', () => {
  beforeEach(() => biz.reset())

  it('loads business by id on mount', async () => {
    renderController(BusinessBasicInformation, { businessId: 3 })
    await waitFor(() => {
      expect(lastControllerProps.businessState.loading).toBe(false)
    })
    expect(biz.mockBusinessGet).toHaveBeenCalled()
    expect(lastControllerProps.businessState.business.name).toBe('Loaded Store')
  })

  it('uses provided business without fetching', async () => {
    renderController(BusinessBasicInformation, { business: biz.sampleBusiness })
    await waitFor(() => {
      expect(lastControllerProps.businessState.business.name).toBe('Taco Shop')
    })
    expect(biz.mockBusinessGet).not.toHaveBeenCalled()
  })
})
