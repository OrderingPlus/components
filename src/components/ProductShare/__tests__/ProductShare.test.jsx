import { describe, it, expect } from 'vitest'
import { renderController, lastControllerProps } from '../../../__tests__/helpers/renderController'
import { ProductShare } from '../index'

describe('ProductShare', () => {
  it('builds share url from slug and ids', () => {
    renderController(ProductShare, {
      slug: 'pizza-place',
      categoryId: 4,
      productId: 9
    })
    expect(lastControllerProps.urlToShare).toContain('/store/pizza-place')
    expect(lastControllerProps.urlToShare).toContain('category=4')
    expect(lastControllerProps.urlToShare).toContain('product=9')
    expect(typeof lastControllerProps.updateShowValue).toBe('function')
    expect(lastControllerProps.showShareButton).toBe(false)
  })
})
