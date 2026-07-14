import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createMockOrdering } from '../../../../__tests__/helpers/mockOrdering'

describe('SDK API classes batch', () => {
  let ordering

  beforeEach(() => {
    ordering = createMockOrdering()
    vi.clearAllMocks()
  })

  describe('ApiUser', () => {
    it('GETs user by id', async () => {
      await ordering.users(5).get()
      expect(ordering.get).toHaveBeenCalledWith('/users/5', expect.any(Object))
    })

    it('rejects where() with userId', async () => {
      const api = ordering.users(5)
      api.where([{ attribute: 'id', value: 5 }])
      await expect(api.get()).rejects.toThrow('where` function is not compatible')
    })

    it('requires userId for delete', async () => {
      await expect(ordering.users().delete()).rejects.toThrow('userId` is require')
    })

    it('POSTs auth and sets userId on success', async () => {
      ordering.post.mockResolvedValueOnce({ content: { error: false, result: { id: 99 } } })
      const api = ordering.users()
      await api.auth({ email: 'a@test.com', password: 'x' })
      expect(ordering.post).toHaveBeenCalledWith('/auth', { email: 'a@test.com', password: 'x' }, expect.any(Object))
      expect(api.userId).toBe(99)
    })

    it('POSTs logout', async () => {
      await ordering.users(1).logout({ notification_token: 'tok' })
      expect(ordering.post).toHaveBeenCalledWith('/auth/logout', { notification_token: 'tok' }, expect.any(Object))
    })

    it('requires userId for alerts', () => {
      expect(() => ordering.users().alerts()).toThrow('userId` is require')
    })

    it('requires userId for addresses', () => {
      expect(() => ordering.users().addresses()).toThrow('userId` is require')
    })
  })

  describe('ApiOrder', () => {
    it('GETs order by id', async () => {
      await ordering.orders(8).get()
      expect(ordering.get).toHaveBeenCalledWith('/orders/8', expect.any(Object))
    })

    it('rejects where() with orderId', async () => {
      const api = ordering.orders(8)
      api.where([{ attribute: 'status', value: 1 }])
      await expect(api.get()).rejects.toThrow('where` function is not compatible')
    })
  })

  describe('ApiConfig', () => {
    it('GETs configs list', async () => {
      await ordering.configs().get()
      expect(ordering.get).toHaveBeenCalledWith('/configs', expect.any(Object))
    })

    it('GETs single config', async () => {
      await ordering.configs(3).get()
      expect(ordering.get).toHaveBeenCalledWith('/configs/3', expect.any(Object))
    })
  })

  describe('ApiBusiness', () => {
    it('GETs business by id', async () => {
      await ordering.businesses(12).get()
      expect(ordering.get).toHaveBeenCalledWith('/business/12', expect.any(Object))
    })

    it('uses search endpoint for advancedSearch', async () => {
      await ordering.businesses().get({ advancedSearch: true })
      expect(ordering.get).toHaveBeenCalledWith('/search', expect.any(Object))
    })

    it('requires businessId for delete', async () => {
      await expect(ordering.businesses().delete()).rejects.toThrow('businessId` is require')
    })

    it('requires numeric businessId for products()', () => {
      expect(() => ordering.businesses('slug').products()).toThrow('must be a number')
    })
  })

  describe('ApiSystem', () => {
    it('POSTs system auth', async () => {
      await ordering.system().auth({ key: 'secret' })
      expect(ordering.post).toHaveBeenCalledWith(
        '/system/auth',
        { key: 'secret' },
        expect.objectContaining({ system: true })
      )
    })

    it('POSTs system code', async () => {
      await ordering.system().getCode({ phone: '123' })
      expect(ordering.post).toHaveBeenCalledWith(
        '/system/code',
        { phone: '123' },
        expect.objectContaining({ system: true })
      )
    })
  })
})
