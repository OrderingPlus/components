import { describe, it, expect, vi, beforeEach } from 'vitest'
import { waitFor, act } from '@testing-library/react'
import { renderController, lastControllerProps } from '../../../__tests__/helpers/renderController'

const acms = vi.hoisted(() => {
  const { createAnalyticsCmsTestContext } = require('../../../__tests__/helpers/analyticsCmsTestHelpers')
  return createAnalyticsCmsTestContext(vi)
})

vi.mock('../../../contexts/ApiContext', () => ({
  useApi: () => [acms.mockOrdering]
}))

import { BusinessReviews } from '../index'

describe('BusinessReviews', () => {
  beforeEach(() => acms.reset())

  it('uses reviews prop without fetching', () => {
    renderController(BusinessReviews, { reviews: acms.sampleReviews })
    expect(lastControllerProps.reviewsList.reviews).toHaveLength(2)
    expect(lastControllerProps.reviewsList.loading).toBe(false)
  })

  it('fetches reviews from business API when prop is empty', async () => {
    renderController(BusinessReviews, { businessId: 5 })
    await waitFor(() => {
      expect(lastControllerProps.reviewsList.loading).toBe(false)
    })
    expect(lastControllerProps.reviewsList.reviews).toHaveLength(2)
  })

  it('filters reviews by star rating and comment text', () => {
    renderController(BusinessReviews, { reviews: acms.sampleReviews })
    act(() => {
      lastControllerProps.handleClickOption(5)
    })
    expect(lastControllerProps.reviewsList.reviews).toHaveLength(1)
    act(() => {
      lastControllerProps.onChangeReview('excellent')
    })
    expect(lastControllerProps.reviewsList.reviews[0].comment).toContain('Excellent')
  })
})
