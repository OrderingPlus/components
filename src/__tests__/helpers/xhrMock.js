import { vi } from 'vitest'

/**
 * Install a minimal XMLHttpRequest mock for Ordering SDK HTTP calls.
 */
export const installXhrMock = ({
  status = 200,
  response = { error: false, result: {} },
  onRequest
} = {}) => {
  class MockXHR {
    constructor () {
      this.status = status
      this.statusText = 'OK'
      this.response = typeof response === 'string' ? response : JSON.stringify(response)
      this.requestHeaders = {}
      this.method = null
      this.url = null
      this.body = null
    }

    open (method, url) {
      this.method = method
      this.url = url
    }

    setRequestHeader (key, value) {
      this.requestHeaders[key] = value
    }

    send (body) {
      this.body = body
      onRequest?.(this)
      queueMicrotask(() => this.onload?.())
    }
  }

  vi.stubGlobal('XMLHttpRequest', MockXHR)
  return MockXHR
}
