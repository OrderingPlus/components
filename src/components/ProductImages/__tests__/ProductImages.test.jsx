import { describe, it, expect } from 'vitest'
import { renderController, lastControllerProps } from '../../../__tests__/helpers/renderController'
import { ProductImages } from '../index'

describe('ProductImages', () => {
  it('passes hero and gallery props through', () => {
    renderController(ProductImages, {
      hero: 'hero.jpg',
      gallery: ['a.jpg', 'b.jpg']
    })
    expect(lastControllerProps.hero).toBe('hero.jpg')
    expect(lastControllerProps.gallery).toHaveLength(2)
  })
})
