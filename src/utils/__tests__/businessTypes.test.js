import { describe, it, expect } from 'vitest'
import {
  collectTypeIdsFromBusinesses,
  filterBusinessTypesByLocation,
  normalizeAvailableTypeIds
} from '../businessTypes'

describe('businessTypes', () => {
  describe('collectTypeIdsFromBusinesses', () => {
    it('returns empty set for empty input', () => {
      expect(collectTypeIdsFromBusinesses()).toEqual(new Set())
      expect(collectTypeIdsFromBusinesses([])).toEqual(new Set())
    })

    it('collects unique type ids across businesses', () => {
      const businesses = [
        { types: [{ id: 1 }, { id: 2 }] },
        { types: [{ id: 2 }, { id: 3 }] },
        { types: null }
      ]
      expect(collectTypeIdsFromBusinesses(businesses)).toEqual(new Set([1, 2, 3]))
    })

    it('skips types without id', () => {
      const businesses = [{ types: [{ id: null }, { name: 'Food' }] }]
      expect(collectTypeIdsFromBusinesses(businesses)).toEqual(new Set())
    })
  })

  describe('filterBusinessTypesByLocation', () => {
    const types = [
      { id: 1, name: 'Food' },
      { id: 2, name: 'Groceries' },
      { id: null, name: 'All' },
      { name: 'Other' }
    ]

    it('returns all types when availableTypeIds is empty', () => {
      expect(filterBusinessTypesByLocation(types, null)).toEqual(types)
      expect(filterBusinessTypesByLocation(types, new Set())).toEqual(types)
    })

    it('keeps All, null-id, and matching types', () => {
      const available = new Set([1])
      expect(filterBusinessTypesByLocation(types, available)).toEqual([
        { id: 1, name: 'Food' },
        { id: null, name: 'All' },
        { name: 'Other' }
      ])
    })
  })

  describe('normalizeAvailableTypeIds', () => {
    it('returns null for falsy input', () => {
      expect(normalizeAvailableTypeIds(null)).toBeNull()
      expect(normalizeAvailableTypeIds(undefined)).toBeNull()
    })

    it('returns null for empty Set or array', () => {
      expect(normalizeAvailableTypeIds(new Set())).toBeNull()
      expect(normalizeAvailableTypeIds([])).toBeNull()
    })

    it('returns Set for non-empty Set input', () => {
      const input = new Set([1, 2])
      expect(normalizeAvailableTypeIds(input)).toBe(input)
    })

    it('builds Set from array and filters null ids', () => {
      expect(normalizeAvailableTypeIds([1, null, 2])).toEqual(new Set([1, 2]))
    })

    it('returns null for unsupported types', () => {
      expect(normalizeAvailableTypeIds('1,2')).toBeNull()
    })
  })
})
