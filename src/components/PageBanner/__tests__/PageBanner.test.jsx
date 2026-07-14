import { describe, it, expect, vi } from 'vitest'
import { waitFor } from '@testing-library/react'
import { renderController, lastControllerProps } from '../../../__tests__/helpers/renderController'

const mockSocket = {
  getId: () => 'socket-1'
}

vi.mock('../../../contexts/ApiContext', () => ({
  useApi: () => [{
    appId: 'app',
    appInternalName: 'web',
    root: 'https://api.test'
  }]
}))

vi.mock('../../../contexts/WebsocketContext', () => ({
  useWebsocket: () => mockSocket
}))

vi.mock('../../../contexts/ConfigContext', () => ({
  useConfig: () => [{ configs: {} }]
}))

vi.mock('../../../contexts/OrderContext', () => ({
  useOrder: () => [{ options: { type: 1 } }]
}))

import { PageBanner } from '../index'

describe('PageBanner', () => {
  it('loads banner and passes pageBannerState', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: async () => ({ error: false, result: [{ items: [{ id: 1 }] }] })
    })
    renderController(PageBanner, { position: 'app_home_page' })
    await waitFor(() => {
      expect(lastControllerProps.pageBannerState.loading).toBe(false)
    })
    expect(lastControllerProps.pageBannerState.banner?.items).toHaveLength(1)
  })
})
