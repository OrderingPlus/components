import { describe, it, expect } from 'vitest'
import {
  buildSubcategoryRankMap,
  sortProductsBySubcategoryRank,
  sortSubcategoriesByRank
} from '../subcategoryProductSort'

describe('subcategoryProductSort', () => {
  const parentCategory = {
    id: 10,
    subcategories: [
      { id: 20, rank: 2, subcategories: [{ id: 21, rank: 1 }] },
      { id: 30, rank: 1 }
    ]
  }

  describe('buildSubcategoryRankMap', () => {
    it('returns empty map when no subcategories', () => {
      expect(buildSubcategoryRankMap({})).toEqual({})
      expect(buildSubcategoryRankMap({ subcategories: [] })).toEqual({})
    })

    it('maps nested subcategory ids to ranks', () => {
      expect(buildSubcategoryRankMap(parentCategory)).toEqual({
        20: 2,
        21: 1,
        30: 1
      })
    })
  })

  describe('sortProductsBySubcategoryRank', () => {
    it('returns empty array for empty products', () => {
      expect(sortProductsBySubcategoryRank([], parentCategory)).toEqual([])
      expect(sortProductsBySubcategoryRank(null, parentCategory)).toEqual([])
    })

    it('returns copy when parent has no subcategories', () => {
      const products = [{ id: 1, category_id: 20 }]
      const result = sortProductsBySubcategoryRank(products, { id: 10 })
      expect(result).toEqual(products)
      expect(result).not.toBe(products)
    })

    it('sorts by subcategory rank then product rank', () => {
      const products = [
        { id: 1, category_id: 20, rank: 5, name: 'B' },
        { id: 2, category_id: 30, rank: 1, name: 'A' },
        { id: 3, category_id: 10, rank: 99, name: 'Parent' }
      ]
      const sorted = sortProductsBySubcategoryRank(products, parentCategory)
      expect(sorted.map((p) => p.id)).toEqual([3, 2, 1])
    })

    it('sorts alphabetically when sortByValue is a-z', () => {
      const products = [
        { id: 1, category_id: 30, name: 'Zebra' },
        { id: 2, category_id: 30, name: 'Apple' }
      ]
      const sorted = sortProductsBySubcategoryRank(products, parentCategory, 'a-z')
      expect(sorted.map((p) => p.name)).toEqual(['Apple', 'Zebra'])
    })

    it('sorts by rank_desc as secondary key', () => {
      const products = [
        { id: 1, category_id: 30, rank: 1 },
        { id: 2, category_id: 30, rank: 5 }
      ]
      const sorted = sortProductsBySubcategoryRank(products, parentCategory, 'rank_desc')
      expect(sorted.map((p) => p.id)).toEqual([2, 1])
    })

    it('places unknown category ids at the end', () => {
      const products = [
        { id: 1, category_id: 999, rank: 1 },
        { id: 2, category_id: 30, rank: 1 }
      ]
      const sorted = sortProductsBySubcategoryRank(products, parentCategory)
      expect(sorted.map((p) => p.id)).toEqual([2, 1])
    })
  })

  describe('sortSubcategoriesByRank', () => {
    it('returns empty array for empty input', () => {
      expect(sortSubcategoriesByRank()).toEqual([])
      expect(sortSubcategoriesByRank([])).toEqual([])
    })

    it('sorts subcategories by rank ascending', () => {
      const subs = [{ rank: 3 }, { rank: 1 }, { rank: 2 }]
      expect(sortSubcategoriesByRank(subs).map((s) => s.rank)).toEqual([1, 2, 3])
    })
  })
})
