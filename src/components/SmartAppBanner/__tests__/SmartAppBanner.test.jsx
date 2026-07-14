import { describe, it, expect, vi } from 'vitest'
import { renderController, lastControllerProps } from '../../../__tests__/helpers/renderController'

vi.mock('smart-app-banner', () => ({
  default: vi.fn().mockImplementation(() => ({
    hide: vi.fn()
  }))
}))

vi.mock('../../../contexts/LanguageContext', () => ({
  useLanguage: () => [{}, (key, fallback) => fallback || key]
}))

import { SmartAppBanner } from '../index'

describe('SmartAppBanner', () => {
  it('renders without store ids', () => {
    renderController(SmartAppBanner, { appName: 'Demo App' })
    expect(lastControllerProps.appName).toBe('Demo App')
  })

  it('injects store meta tags when ids are provided', () => {
    document.head.innerHTML = ''
    renderController(SmartAppBanner, {
      appName: 'Demo App',
      storeAndroidId: 'com.demo',
      storeAppleId: '123456'
    })
    expect(document.querySelector('meta[name="apple-itunes-app"]')?.content).toBe('app-id=123456')
    expect(document.querySelector('meta[name="google-play-app"]')?.content).toBe('app-id=com.demo')
  })
})
