import { describe, it, expect, vi, beforeEach } from 'vitest'
import { act } from '@testing-library/react'
import { renderController, lastControllerProps } from '../../../__tests__/helpers/renderController'

const dmm = vi.hoisted(() => {
  const { createDriverMessagesMapTestContext } = require('../../../__tests__/helpers/driverMessagesMapTestHelpers')
  return createDriverMessagesMapTestContext(vi)
})

vi.mock('../../../contexts/EventContext', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    useEvent: () => [{ emit: dmm.mockEmit, on: dmm.mockEventsOn, off: dmm.mockEventsOff }]
  }
})

vi.mock('../../../contexts/LanguageContext', () => ({
  useLanguage: () => [{ loading: false, language: { code: 'en' } }, dmm.mockT]
}))

vi.mock('../../../contexts/ToastContext', () => ({
  useToast: () => [[], { showToast: dmm.mockShowToast }],
  ToastType: { error: 'error', success: 'success', info: 'info' }
}))

vi.mock('../../../contexts/WebsocketContext', () => ({
  useWebsocket: () => dmm.mockSocket
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

import { ReviewCustomer } from '../index'

describe('ReviewCustomer', () => {
  beforeEach(() => dmm.reset())

  it('updates qualification through handleChangeQualification', () => {
    renderController(ReviewCustomer, { order: dmm.sampleOrder })
    act(() => {
      lastControllerProps.handleChangeQualification(4)
    })
    expect(lastControllerProps.reviewState.qualification).toBe(4)
  })

  it('submits customer review and emits customer_reviewed', async () => {
    renderController(ReviewCustomer, { order: dmm.sampleOrder, onClose: dmm.mockOnClose })
    act(() => {
      lastControllerProps.setReviewState({
        qualification: 5,
        comment: 'Polite customer',
        order_id: 101,
        user_id: 8
      })
    })
    await act(async () => {
      await lastControllerProps.handleSendCustomerReview()
    })
    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.test/users/8/user_reviews',
      expect.objectContaining({ method: 'POST' })
    )
    expect(dmm.mockEmit).toHaveBeenCalledWith('customer_reviewed', expect.any(Object))
    expect(dmm.mockOnClose).toHaveBeenCalled()
  })
})
