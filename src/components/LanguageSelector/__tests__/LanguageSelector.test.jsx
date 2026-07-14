import { describe, it, expect, vi } from 'vitest'
import { renderController, lastControllerProps } from '../../../__tests__/helpers/renderController'

const mockSetLanguage = vi.fn()
const mockT = (key, fallback) => fallback || key

vi.mock('../../../contexts/LanguageContext', () => ({
  useLanguage: () => [{ language: { code: 'en', name: 'English' } }, mockT, mockSetLanguage]
}))

vi.mock('../../../contexts/ApiContext', () => ({
  useApi: () => [{ appId: 'app', appInternalName: 'web', root: 'https://api.test' }]
}))

import { LanguageSelector } from '../index'

describe('LanguageSelector', () => {
  it('exposes languagesState and handleChangeLanguage', () => {
    const onChangeLanguage = vi.fn()
    renderController(LanguageSelector, {
      languages: [{ code: 'en', name: 'English', default: true }],
      onChangeLanguage
    })
    expect(lastControllerProps.languagesState.languages).toHaveLength(1)
    expect(typeof lastControllerProps.handleChangeLanguage).toBe('function')
    lastControllerProps.handleChangeLanguage('en')
    expect(onChangeLanguage).toHaveBeenCalled()
  })
})
