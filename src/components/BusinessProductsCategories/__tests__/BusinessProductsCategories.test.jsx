import { describe, it, expect } from 'vitest'
import { renderController, lastControllerProps } from '../../../__tests__/helpers/renderController'
import { BusinessProductsCategories } from '../index'

describe('BusinessProductsCategories', () => {
  it('passes categories through to the UI layer', () => {
    const categories = [{ id: 2, name: 'Sides', products: [] }]
    renderController(BusinessProductsCategories, { categories, businessSingleId: 5 })
    expect(lastControllerProps.categories).toEqual(categories)
  })

  it('wires category click handler to onClickCategory', () => {
    const onClickCategory = () => {}
    renderController(BusinessProductsCategories, {
      categories: [{ id: 1, name: 'Mains', products: [] }],
      onClickCategory
    })
    expect(lastControllerProps.handlerClickCategory).toBe(onClickCategory)
  })
})
