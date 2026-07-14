import { describe, it, expect, vi, beforeEach } from 'vitest'
import { act } from '@testing-library/react'
import { renderController, lastControllerProps } from '../../../../__tests__/helpers/renderController'

const d4 = vi.hoisted(() => {
  const { createDashboardLogisticsTestContext } = require('../../../../__tests__/helpers/dashboardLogisticsTestHelpers')
  return createDashboardLogisticsTestContext(vi)
})

vi.mock('../../../../contexts/EventContext', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    useEvent: () => [{ emit: d4.mockEmit, on: d4.mockEventsOn, off: d4.mockEventsOff }]
  }
})

vi.mock('../../../../contexts/LanguageContext', () => ({
  useLanguage: () => [{ loading: false, language: { code: 'en' } }, d4.mockT]
}))

vi.mock('../../../../contexts/ToastContext', () => ({
  useToast: () => [[], { showToast: d4.mockShowToast }],
  ToastType: { error: 'error', success: 'success', info: 'info', Info: 'INFO', Success: 'SUCCESS', Error: 'ERROR' }
}))

vi.mock('../../../../contexts/SessionContext', () => ({
  useSession: () => [d4.mockSessionState, { changeUser: vi.fn() }]
}))

vi.mock('../../../../contexts/ApiContext', () => ({
  useApi: () => [d4.mockOrdering]
}))

import { ReviewCustomer } from '../index'

describe('ReviewCustomer', () => {
  beforeEach(() => d4.reset())

  it('updates qualification and comment', () => {
    renderController(ReviewCustomer, { order: d4.sampleOrder })
    act(() => {
      lastControllerProps.handleChangeQualification(5)
    })
    expect(lastControllerProps.reviewState.qualification).toBe(5)
    act(() => {
      lastControllerProps.setReviewState({ ...lastControllerProps.reviewState, comment: 'Great customer' })
    })
    expect(lastControllerProps.reviewState.comment).toBe('Great customer')
  })

  it('submits customer review', async () => {
    const onClose = vi.fn()
    renderController(ReviewCustomer, { order: d4.sampleOrder, onClose })
    act(() => {
      lastControllerProps.handleChangeQualification(5)
      lastControllerProps.setReviewState({
        ...lastControllerProps.reviewState,
        comment: 'Great customer'
      })
    })
    await act(async () => {
      await lastControllerProps.handleSendCustomerReview()
    })
    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.test/users/8/user_reviews',
      expect.objectContaining({ method: 'POST' })
    )
    expect(d4.mockEmit).toHaveBeenCalledWith('customer_reviewed', { id: 1, qualification: 5 })
    expect(onClose).toHaveBeenCalled()
  })
})
