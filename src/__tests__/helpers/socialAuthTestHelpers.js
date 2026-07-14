import { vi } from 'vitest'

export const createGoogleUser = (token = 'google-id-token') => ({
  getAuthResponse: () => ({ id_token: token })
})

export const setupGapi = (overrides = {}) => {
  const signIn = vi.fn().mockResolvedValue(createGoogleUser())
  const signOut = vi.fn().mockResolvedValue(undefined)
  const disconnect = vi.fn().mockResolvedValue(undefined)
  const authInstance = {
    isSignedIn: { get: () => false },
    signIn,
    signOut,
    disconnect,
    currentUser: { get: () => createGoogleUser() },
    ...overrides.authInstance
  }

  window.gapi = {
    load: vi.fn((api, cb) => {
      if (typeof cb === 'function') cb()
    }),
    auth2: {
      getAuthInstance: vi.fn(() => overrides.noInstance ? null : authInstance),
      init: vi.fn(() => Promise.resolve({
        isSignedIn: { get: () => false },
        currentUser: { get: () => createGoogleUser() }
      }))
    },
    signin2: { render: vi.fn() }
  }

  return { signIn, signOut, disconnect, authInstance }
}

export const setupFacebook = () => {
  const anchor = document.createElement('script')
  document.body.appendChild(anchor)
  window.FB = {
    init: vi.fn(),
    getLoginStatus: vi.fn((cb) => cb({ status: 'unknown' })),
    login: vi.fn((cb) => cb({
      status: 'connected',
      authResponse: { accessToken: 'fb-token' }
    })),
    logout: vi.fn((cb) => cb({})),
    api: vi.fn((path, cb) => cb({}))
  }
}

export const setupApple = () => {
  window.AppleID = {
    auth: {
      init: vi.fn(),
      signIn: vi.fn().mockResolvedValue({
        authorization: { code: 'apple-code' }
      })
    }
  }
}

export const resetSocialAuthDom = () => {
  document.body.innerHTML = ''
  document.head.innerHTML = ''
  delete window.gapi
  delete window.FB
  delete window.AppleID
  delete window.grecaptcha
}
