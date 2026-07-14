import { describe, it, expect, vi, beforeEach } from 'vitest'
import { waitFor, act } from '@testing-library/react'
import { renderController, lastControllerProps } from '../../../../__tests__/helpers/renderController'

const d1 = vi.hoisted(() => {
  const { createDashboardOrdersTestContext } = require('../../../../__tests__/helpers/dashboardOrdersTestHelpers')
  return createDashboardOrdersTestContext(vi)
})

import { OrdersFilter } from '../index'

describe('OrdersFilter', () => {
  beforeEach(() => d1.reset())

  it('updates order id filter and strips non-numeric chars', () => {
    renderController(OrdersFilter, { driverGroupList: { groups: [] } })
    act(() => {
      lastControllerProps.handleChangeOrderId({ target: { value: '12a3.4.5' } })
    })
    expect(lastControllerProps.filterValues.orderId).toBe('123.45')
  })

  it('toggles business and status filters', () => {
    renderController(OrdersFilter, { driverGroupList: { groups: [] } })
    act(() => {
      lastControllerProps.handleChangeBusinesses(1)
    })
    expect(lastControllerProps.filterValues.businessIds).toEqual([1])
    act(() => {
      lastControllerProps.handleChangeOrderStatus(0)
    })
    expect(lastControllerProps.filterValues.statuses).toEqual([0])
    act(() => {
      lastControllerProps.handleChangeBusinesses(1)
    })
    expect(lastControllerProps.filterValues.businessIds).toEqual([])
    act(() => {
      lastControllerProps.handleChangeOrderStatus(0)
    })
    expect(lastControllerProps.filterValues.statuses).toEqual([])
  })

  it('sets today date filter preset', () => {
    renderController(OrdersFilter, { driverGroupList: { groups: [] } })
    act(() => {
      lastControllerProps.handleChangeDateType('today')
    })
    expect(lastControllerProps.filterValues.dateType).toBe('today')
    expect(lastControllerProps.filterValues.deliveryFromDatetime).toBeTruthy()
  })

  it('resets all filter values', () => {
    renderController(OrdersFilter, { driverGroupList: { groups: [] } })
    act(() => {
      lastControllerProps.handleChangeBusinesses(1)
      lastControllerProps.handleResetFilterValues()
    })
    expect(lastControllerProps.filterValues.businessIds).toEqual([])
  })

  it('derives driver group ids from selected group types', async () => {
    renderController(OrdersFilter, {
      driverGroupList: { groups: [{ id: 1, drivers: [4, 5] }] }
    })
    act(() => {
      lastControllerProps.handleChangeGroup(1)
    })
    await waitFor(() => {
      expect(lastControllerProps.filterValues.driverGroupIds).toEqual([4, 5])
    })
  })

  it('supports metafield add/edit/delete and delivery filters', () => {
    renderController(OrdersFilter, { driverGroupList: { groups: [] } })
    act(() => {
      lastControllerProps.handleAddMetaField({ id: 1, key: 'zone', value: 'north' })
    })
    expect(lastControllerProps.filterValues.metafield).toHaveLength(1)
    act(() => {
      lastControllerProps.handleChangeExternalId({ target: { value: 'EXT-1' } })
    })
    expect(lastControllerProps.filterValues.externalId).toBe('EXT-1')
    act(() => {
      lastControllerProps.handleChangeDeliveryType(1)
    })
    expect(lastControllerProps.filterValues.deliveryTypes).toEqual([1])
    act(() => {
      lastControllerProps.handleChangePaymethodType(2)
    })
    expect(lastControllerProps.filterValues.paymethodIds).toEqual([2])
    act(() => {
      lastControllerProps.handleChangeDriver(4)
    })
    expect(lastControllerProps.filterValues.driverIds).toEqual([4])
    act(() => {
      lastControllerProps.handleChangeMetaFieldValue({ target: { name: 'value', value: 'south' } }, 1)
    })
    expect(lastControllerProps.filterValues.metafield[0].value).toBe('south')
    act(() => {
      lastControllerProps.handleDeleteMetafield(1)
    })
    expect(lastControllerProps.filterValues.metafield).toHaveLength(0)
  })

  it('covers remaining date presets and location filters', () => {
    renderController(OrdersFilter, { driverGroupList: { groups: [] } })
    act(() => {
      lastControllerProps.handleChangeDateType('last7')
    })
    expect(lastControllerProps.filterValues.dateType).toBe('last7')
    act(() => {
      lastControllerProps.handleChangeDateType('last30')
    })
    expect(lastControllerProps.filterValues.dateType).toBe('last30')
    act(() => {
      lastControllerProps.handleChangeDateType('term')
    })
    act(() => {
      lastControllerProps.handleChangeFromDate(new Date('2026-01-01'))
    })
    act(() => {
      lastControllerProps.handleChangeEndDate(new Date('2026-01-31'))
    })
    act(() => {
      lastControllerProps.handleChangeCity(3)
    })
    expect(lastControllerProps.filterValues.cityIds).toEqual([3])
    act(() => {
      lastControllerProps.handleChangeCountryCode('US')
    })
    expect(lastControllerProps.filterValues.countryCode).toEqual(['US'])
    act(() => {
      lastControllerProps.handleChangeCurrency('USD')
    })
    expect(lastControllerProps.filterValues.currency).toEqual(['USD'])
  })
})
