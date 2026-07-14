import { describe, it, expect, vi, beforeEach } from 'vitest'
import { waitFor } from '@testing-library/react'
import { renderController, lastControllerProps } from '../../../__tests__/helpers/renderController'
import { BusinessSortControl } from '../index'

describe('BusinessSortControl', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('filters sort options for delivery order type', async () => {
    const onChangeSortOption = vi.fn()
    renderController(BusinessSortControl, {
      orderType: 'delivery_time',
      sortOptions: ['Distance', 'Pickup time', 'Delivery time'],
      defaultSortOption: 'Distance',
      onChangeSortOption
    })
    await waitFor(() => {
      expect(lastControllerProps.sortOptions).toEqual(['Distance', 'Delivery time'])
    })
  })

  it('notifies parent when sort option changes', async () => {
    const onChangeSortOption = vi.fn()
    renderController(BusinessSortControl, {
      orderType: 'pickup_time',
      sortOptions: ['Distance', 'Pickup time', 'Delivery time'],
      onChangeSortOption
    })
    lastControllerProps.onChangeSortOption('Pickup time')
    expect(onChangeSortOption).toHaveBeenCalledWith('Pickup time')
    await waitFor(() => {
      expect(lastControllerProps.currentOptionSelected).toBe('Pickup time')
    })
  })
})
