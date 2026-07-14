import { describe, it, expect, vi, beforeEach } from 'vitest'
import { waitFor } from '@testing-library/react'
import { renderController, lastControllerProps } from '../../../__tests__/helpers/renderController'

const acms = vi.hoisted(() => {
  const { createAnalyticsCmsTestContext } = require('../../../__tests__/helpers/analyticsCmsTestHelpers')
  return createAnalyticsCmsTestContext(vi)
})

vi.mock('../../../contexts/ApiContext', () => ({
  useApi: () => [acms.mockOrdering]
}))

import { ProfessionalInfo } from '../index'

describe('ProfessionalInfo', () => {
  beforeEach(() => acms.reset())

  it('loads professional profile and reviews from API', async () => {
    renderController(ProfessionalInfo, { userId: 12 })
    await waitFor(() => {
      expect(lastControllerProps.userState.loading).toBe(false)
    })
    expect(lastControllerProps.userState.user.id).toBe(12)
    await waitFor(() => {
      expect(lastControllerProps.userReviewState.reviews).toHaveLength(1)
    })
  })

  it('uses user prop without fetching profile', async () => {
    renderController(ProfessionalInfo, { userId: 12, user: acms.sampleProfessional })
    expect(lastControllerProps.userState.user).toEqual(acms.sampleProfessional)
    await waitFor(() => {
      expect(lastControllerProps.userReviewState.reviews).toHaveLength(1)
    })
  })
})
