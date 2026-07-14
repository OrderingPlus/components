import { describe, it, expect, vi, beforeEach } from 'vitest'
import { act } from '@testing-library/react'
import { renderController, lastControllerProps } from '../../../__tests__/helpers/renderController'

const acms = vi.hoisted(() => {
  const { createAnalyticsCmsTestContext } = require('../../../__tests__/helpers/analyticsCmsTestHelpers')
  return createAnalyticsCmsTestContext(vi)
})

vi.mock('../../../contexts/LanguageContext', () => ({
  useLanguage: () => [{ loading: false, language: { code: 'en' } }, acms.mockT]
}))

vi.mock('../../../contexts/ToastContext', () => ({
  useToast: () => [[], { showToast: acms.mockShowToast }],
  ToastType: { error: 'error', success: 'success', info: 'info' }
}))

vi.mock('../../../contexts/SessionContext', () => ({
  useSession: () => [{
    auth: true,
    loading: false,
    user: { id: 8, name: 'Test', last_name: 'User' },
    token: 'session-tok'
  }]
}))

vi.mock('../../../contexts/ApiContext', () => ({
  useApi: () => [acms.mockOrdering]
}))

import { SingleProfessionalCard } from '../index'

describe('SingleProfessionalCard', () => {
  beforeEach(() => acms.reset())

  it('adds professional to favorites', async () => {
    renderController(SingleProfessionalCard, {
      professional: acms.sampleProfessional,
      handleUpdateProfessionals: acms.mockHandleUpdateProfessionals
    })
    await act(async () => {
      await lastControllerProps.handleFavoriteProfessional(true)
    })
    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.test/users/8/favorite_users',
      expect.objectContaining({ method: 'POST' })
    )
    expect(acms.mockHandleUpdateProfessionals).toHaveBeenCalledWith(12, { favorite: true })
    expect(acms.mockShowToast).toHaveBeenCalled()
  })

  it('removes professional from favorites', async () => {
    renderController(SingleProfessionalCard, { professional: acms.sampleProfessional })
    await act(async () => {
      await lastControllerProps.handleFavoriteProfessional(false)
    })
    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.test/users/8/favorite_users/12',
      expect.objectContaining({ method: 'DELETE' })
    )
  })
})
