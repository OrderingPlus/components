import { describe, it, expect, vi, beforeAll } from 'vitest'
import { renderController, lastControllerProps } from '../../../__tests__/helpers/renderController'

vi.mock('../../../hooks/useGoogleMaps', () => ({
  useGoogleMaps: () => [true]
}))

import { GpsButton } from '../index'

describe('GpsButton', () => {
  beforeAll(() => {
    Object.defineProperty(global.navigator, 'geolocation', {
      configurable: true,
      value: {
        getCurrentPosition: vi.fn((success) => {
          success({ coords: { latitude: 40.7, longitude: -74.0 } })
        })
      }
    })
  })

  it('exposes handleGPS when geolocation is available', () => {
    const onData = vi.fn()
    renderController(GpsButton, { onData, apiKey: '' })
    expect(typeof lastControllerProps.handleGPS).toBe('function')
    lastControllerProps.handleGPS()
    expect(onData).toHaveBeenCalledWith(expect.objectContaining({
      location: { lat: 40.7, lng: -74 }
    }))
  })
})
