import { describe, it, expect, vi, beforeEach } from 'vitest'
import { act } from '@testing-library/react'
import { renderController, lastControllerProps } from '../../../__tests__/helpers/renderController'

const dmm = vi.hoisted(() => {
  const { createDriverMessagesMapTestContext } = require('../../../__tests__/helpers/driverMessagesMapTestHelpers')
  return createDriverMessagesMapTestContext(vi)
})

vi.mock('../../../contexts/ToastContext', () => ({
  useToast: () => [[], { showToast: dmm.mockShowToast }],
  ToastType: { error: 'error', success: 'success', info: 'info' }
}))

vi.mock('../../../contexts/SessionContext', () => ({
  useSession: () => [{
    auth: true,
    loading: false,
    user: { id: 8, name: 'Test User', level: 4 },
    token: 'session-tok'
  }]
}))

vi.mock('../../../contexts/ApiContext', () => ({
  useApi: () => [dmm.mockOrdering]
}))

import { ReviewDriver } from '../index'

describe('ReviewDriver', () => {
  beforeEach(() => dmm.reset())

  it('submits a driver review to the API', async () => {
    renderController(ReviewDriver, { order: dmm.sampleOrder, isToast: true })
    act(() => {
      lastControllerProps.setDriverReviews({ qualification: 4, comment: 'Great' })
    })
    await act(async () => {
      await lastControllerProps.handleSendDriverReview()
    })
    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.test/users/4/user_reviews',
      expect.objectContaining({ method: 'POST' })
    )
    expect(dmm.mockShowToast).toHaveBeenCalled()
  })

  it('submits a professional review when isProfessional is enabled', async () => {
    renderController(ReviewDriver, {
      order: dmm.sampleOrder,
      isProfessional: true,
      isToast: true
    })
    await act(async () => {
      await lastControllerProps.handleSendDriverReview()
    })
    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.test/users/9/user_reviews',
      expect.objectContaining({ method: 'POST' })
    )
  })
})
