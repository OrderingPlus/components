import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderController, lastControllerProps } from '../../../__tests__/helpers/renderController'

const biz = vi.hoisted(() => {
  const h = require('../../../__tests__/helpers/businessDiscoveryTestHelpers')
  const mockEmit = vi.fn()
  const reset = () => {
    vi.clearAllMocks()
    h.setupGoogleMaps(vi)
  }
  return { mockEmit, reset }
})

vi.mock('../../../contexts/EventContext', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    useEvent: () => [{ emit: biz.mockEmit }]
  }
})

import { waitFor } from '@testing-library/react'
import { BusinessesMap } from '../index'

describe('BusinessesMap', () => {
  beforeEach(() => biz.reset())

  it('maps businesses with valid coordinates', async () => {
    renderController(BusinessesMap, {
      businessList: [
        { slug: 'a', logo: 'a.png', location: { lat: 40.7, lng: -74 } },
        { slug: 'b', location: {} }
      ]
    })
    await waitFor(() => {
      expect(lastControllerProps.businessLocations).toHaveLength(1)
    })
    expect(lastControllerProps.businessLocations[0].slug).toBe('a')
  })

  it('emits navigation event on business click', () => {
    renderController(BusinessesMap, { businessList: [] })
    lastControllerProps.onBusinessClick('taco-shop')
    expect(biz.mockEmit).toHaveBeenCalledWith('go_to_page', {
      page: 'business',
      params: { store: 'taco-shop' }
    })
  })

  it('uses custom click handler when provided', () => {
    const onBusinessCustomClick = vi.fn()
    renderController(BusinessesMap, {
      businessList: [],
      onBusinessCustomClick
    })
    const business = { slug: 'custom' }
    lastControllerProps.onBusinessClick('custom', business)
    expect(onBusinessCustomClick).toHaveBeenCalledWith('custom', business)
    expect(biz.mockEmit).not.toHaveBeenCalled()
  })
})
