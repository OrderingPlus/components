import { describe, it, expect, vi, beforeEach } from 'vitest'
import { act } from '@testing-library/react'
import { renderController, lastControllerProps } from '../../../../__tests__/helpers/renderController'

const upm = vi.hoisted(() => {
  const { createUserProjectMiscTestContext } = require('../../../../__tests__/helpers/userProjectMiscTestHelpers')
  return createUserProjectMiscTestContext(vi)
})

vi.mock('../../../../contexts/LanguageContext', () => ({
  useLanguage: () => [{ loading: false, language: { code: 'en' } }, upm.mockT]
}))

vi.mock('../../../../contexts/ToastContext', () => ({
  useToast: () => [[], { showToast: upm.mockShowToast }],
  ToastType: { error: 'error', success: 'success', info: 'info' }
}))

vi.mock('../../../../contexts/SessionContext', () => ({
  useSession: () => [{
    auth: true,
    loading: false,
    user: upm.sampleUser,
    token: 'session-tok'
  }]
}))

vi.mock('../../../../contexts/ApiContext', () => ({
  useApi: () => [upm.mockOrdering, { setOrdering: upm.mockSetOrdering }]
}))

import { SendGiftCard } from '../index'

describe('SendGiftCard', () => {
  beforeEach(() => upm.reset())

  it('posts recipient details', async () => {
    renderController(SendGiftCard, {
      giftCardId: 1,
      setIsGiftCardSent: upm.mockSetIsGiftCardSent,
      showToastMsg: true
    })
    await act(async () => {
      await lastControllerProps.handleSendGiftCard({ email: 'friend@test.com', message: 'Enjoy!' })
    })
    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.test/gift_cards/1/send',
      expect.objectContaining({ method: 'POST' })
    )
    expect(upm.mockSetIsGiftCardSent).toHaveBeenCalledWith(true)
    expect(upm.mockShowToast).toHaveBeenCalled()
  })
})
