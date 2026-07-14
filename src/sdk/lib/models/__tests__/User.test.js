import { describe, it, expect } from 'vitest'
import { User, Session } from '../User'

describe('User model', () => {
  it('maps role helpers by level', () => {
    expect(new User({ level: 0 }).isAdministrator()).toBe(true)
    expect(new User({ level: 2 }).isBusinessOwner()).toBe(true)
    expect(new User({ level: 3 }).isCustomer()).toBe(true)
    expect(new User({ level: 4 }).isDriver()).toBe(true)
  })

  it('wraps session and exposes access token', () => {
    const user = new User({
      id: 9,
      session: { access_token: 'token-abc', expires_in: 3600, token_type: 'Bearer' }
    })
    expect(user.session).toBeInstanceOf(Session)
    expect(user.getAccessToken()).toBe('token-abc')
    expect(user.getId()).toBe(9)
  })
})
