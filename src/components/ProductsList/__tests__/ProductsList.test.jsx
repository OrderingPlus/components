import { describe, it, expect } from 'vitest'
import { waitFor } from '@testing-library/react'
import { renderController, lastControllerProps } from '../../../__tests__/helpers/renderController'
import { ProductsList } from '../index'

describe('ProductsList', () => {
  it('filters out categories without an id', async () => {
    renderController(ProductsList, {
      categories: [
        { id: 1, name: 'Mains' },
        { id: null, name: 'Hidden' },
        { name: 'No Id' }
      ]
    })
    await waitFor(() => {
      expect(lastControllerProps.categories).toHaveLength(1)
    })
    expect(lastControllerProps.categories[0].name).toBe('Mains')
  })
})
