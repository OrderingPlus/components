import { describe, it, expect } from 'vitest'
import { renderController, lastControllerProps } from '../../../__tests__/helpers/renderController'
import { ProductItemAccordion } from '../index'

describe('ProductItemAccordion', () => {
  it('sorts product options for display', () => {
    const product = {
      name: 'Burger',
      options: {
        'id:2': { id: 2, name: 'B', rank: 2, extra: { rank: 2 }, suboptions: {} },
        'id:1': { id: 1, name: 'A', rank: 1, extra: { rank: 1 }, suboptions: {} }
      }
    }
    renderController(ProductItemAccordion, { product })
    const info = lastControllerProps.productInfo
    expect(info.options[0].name).toBe('A')
    expect(info.options[1].name).toBe('B')
  })

  it('normalizes cart product suboptions', () => {
    const product = {
      name: 'Burger',
      ingredients: { 'id:1': { id: 1, name: 'Lettuce', selected: true } },
      options: {
        'id:1': {
          id: 1,
          name: 'Size',
          rank: 1,
          extra: { rank: 1 },
          suboptions: { 'id:201': { id: 201, name: 'Large' } }
        }
      }
    }
    renderController(ProductItemAccordion, { product, isCartProduct: true })
    expect(lastControllerProps.productInfo.ingredients).toHaveLength(1)
    expect(lastControllerProps.productInfo.options[0].suboptions).toHaveLength(1)
  })
})
