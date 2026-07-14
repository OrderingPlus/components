import { describe, it, expect, vi, beforeEach } from 'vitest'
import { waitFor, act } from '@testing-library/react'
import { renderController, lastControllerProps } from '../../../__tests__/helpers/renderController'

const dmm = vi.hoisted(() => {
  const { createDriverMessagesMapTestContext } = require('../../../__tests__/helpers/driverMessagesMapTestHelpers')
  return createDriverMessagesMapTestContext(vi)
})

vi.mock('../../../contexts/ApiContext', () => ({
  useApi: () => [dmm.mockOrdering]
}))

import { MainSearch } from '../index'

describe('MainSearch', () => {
  beforeEach(() => dmm.reset())

  it('loads countries when not searching by address', async () => {
    renderController(MainSearch, {
      searchByAddress: false,
      handlerFindBusiness: dmm.mockHandlerFindBusiness
    })
    await waitFor(() => {
      expect(lastControllerProps.allListValues.countries).toHaveLength(1)
    })
  })

  it('cascades country, city, and dropdown selections', async () => {
    renderController(MainSearch, {
      searchByAddress: false,
      handlerFindBusiness: dmm.mockHandlerFindBusiness
    })
    await waitFor(() => expect(lastControllerProps.allListValues.countries).toHaveLength(1))
    act(() => {
      lastControllerProps.handleChangeValue({ name: 'country', value: 1 })
    })
    await waitFor(() => expect(lastControllerProps.allListValues.cities).toHaveLength(1))
    act(() => {
      lastControllerProps.handleChangeValue({ name: 'cityId', value: 10 })
    })
    await waitFor(() => expect(lastControllerProps.allListValues.citiesOptions).toHaveLength(1))
    act(() => {
      lastControllerProps.handleChangeValue({ name: 'dropdownOptionId', value: 100 })
    })
    expect(lastControllerProps.currentValues.dropdownOptionId).toBe(100)
  })

  it('validates form before finding businesses', async () => {
    renderController(MainSearch, {
      searchByAddress: false,
      handlerFindBusiness: dmm.mockHandlerFindBusiness
    })
    await waitFor(() => expect(lastControllerProps.allListValues.countries).toHaveLength(1))

    act(() => {
      lastControllerProps.handleFindBusiness()
    })
    expect(lastControllerProps.isFormErrors).toBe(true)
    expect(dmm.mockHandlerFindBusiness).not.toHaveBeenCalled()

    act(() => {
      lastControllerProps.handleChangeValue({ name: 'country', value: 1 })
    })
    await waitFor(() => expect(lastControllerProps.allListValues.cities).toHaveLength(1))
    act(() => {
      lastControllerProps.handleChangeValue({ name: 'cityId', value: 10 })
    })
    await waitFor(() => expect(lastControllerProps.allListValues.citiesOptions).toHaveLength(1))
    act(() => {
      lastControllerProps.handleChangeValue({ name: 'dropdownOptionId', value: 100 })
    })
    await waitFor(() => {
      expect(lastControllerProps.currentValues.cityId).toBe(10)
      expect(lastControllerProps.currentValues.dropdownOptionId).toBe(100)
    })
    act(() => {
      lastControllerProps.handleFindBusiness()
    })
    expect(dmm.mockHandlerFindBusiness).toHaveBeenCalled()
  })
})
