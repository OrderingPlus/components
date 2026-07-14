import { describe, it, expect, beforeEach } from 'vitest'
import { waitFor } from '@testing-library/react'
import { renderController, lastControllerProps } from '../../../__tests__/helpers/renderController'
import { sampleBusiness } from '../../../__tests__/helpers/businessDiscoveryTestHelpers'
import { BusinessInformation } from '../index'

describe('BusinessInformation', () => {
  beforeEach(() => {
    // no shared mocks required
  })

  it('derives photos, videos, and location from business', async () => {
    renderController(BusinessInformation, { business: sampleBusiness, optionToShow: 'photos' })
    await waitFor(() => {
      expect(lastControllerProps.businessPhotos).toHaveLength(1)
    })
    expect(lastControllerProps.businessVideos).toHaveLength(1)
    expect(lastControllerProps.businessLocation.address).toBe('100 Broadway')
    expect(lastControllerProps.businessSchedule).toHaveLength(1)
  })

  it('changes visible option', async () => {
    renderController(BusinessInformation, { business: sampleBusiness, optionToShow: 'photos' })
    lastControllerProps.onChangeOption('location')
    await waitFor(() => {
      expect(lastControllerProps.optionToShow).toBe('location')
    })
  })
})
